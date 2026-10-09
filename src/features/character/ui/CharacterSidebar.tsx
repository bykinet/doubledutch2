import React, { useState, useEffect, useRef } from "react";
import {
  CharacterItem,
  CharacterRole,
  SelectedCharacters,
} from "@/entities/character/types";
import {
  getAllTurners,
  getAllJumpers,
  getCustomCharacters,
  saveCustomCharacter,
  deleteCustomCharacter,
  getSelectedCharacters,
  saveSelectedCharacters,
  MAX_CUSTOM_JUMPERS,
  MAX_CUSTOM_TURNERS,
  TOTAL_JUMPERS_COUNT,
  TOTAL_TURNERS_COUNT,
  syncCharactersWithFirestore,
} from "@/entities/character/characterRoster";
import { createAvatarPreview } from "@/game/graphics/characterTextures";
import { compressCharacterImage } from "@/shared/utils/imageCompressor";
import { useAuth } from "@/features/auth/model/useAuth";
import { X, Upload, Check, Trash2, UserCheck, Sparkles, Users, Info, ShieldCheck } from "lucide-react";

interface CharacterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacters: (selection: SelectedCharacters) => void;
}

export const CharacterSidebar: React.FC<CharacterSidebarProps> = ({
  isOpen,
  onClose,
  onSelectCharacters,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"turners" | "jumpers" | "upload">("turners");
  const [turners, setTurners] = useState<CharacterItem[]>([]);
  const [jumpers, setJumpers] = useState<CharacterItem[]>([]);
  const [selected, setSelected] = useState<SelectedCharacters>(getSelectedCharacters());

  // Upload form state
  const [uploadName, setUploadName] = useState("");
  const [uploadRole, setUploadRole] = useState<CharacterRole>("jumper");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar cache
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});

  const reloadRoster = () => {
    const allT = getAllTurners();
    const allJ = getAllJumpers();
    setTurners(allT);
    setJumpers(allJ);

    // Generate previews
    const avatars: Record<string, string> = {};
    [...allT, ...allJ].forEach((char) => {
      if (char.avatarUrl) {
        avatars[char.id] = char.avatarUrl;
      } else {
        avatars[char.id] = createAvatarPreview(char);
      }
    });
    setAvatarMap(avatars);
  };

  useEffect(() => {
    reloadRoster();
    setSelected(getSelectedCharacters());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectLeftTurner = (id: string) => {
    const next = { ...selected, leftTurnerId: id };
    setSelected(next);
    saveSelectedCharacters(next);
    onSelectCharacters(next);
  };

  const handleSelectRightTurner = (id: string) => {
    const next = { ...selected, rightTurnerId: id };
    setSelected(next);
    saveSelectedCharacters(next);
    onSelectCharacters(next);
  };

  const handleSelectJumper = (id: string) => {
    const next = { ...selected, jumperId: id };
    setSelected(next);
    saveSelectedCharacters(next);
    onSelectCharacters(next);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressionInfo(null);
    try {
      // Automatically compress to max 256x256 WebP (quality 85%) -> approx 25~35 KB
      const result = await compressCharacterImage(file, 256, 0.85);
      setUploadPreview(result.dataUrl);
      setCompressionInfo(`${result.width}×${result.height} WebP · ${result.sizeKb} KB (품질 85%)`);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err: any) {
      alert("이미지 압축 중 오류: " + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveUpload = async () => {
    if (!uploadPreview || !uploadName.trim()) {
      alert("캐릭터 이름과 이미지를 모두 등록해 주세요.");
      return;
    }

    const customTurners = turners.filter((t) => t.isCustom);
    const customJumpers = jumpers.filter((j) => j.isCustom);
    if (uploadRole === "turner" && customTurners.length >= MAX_CUSTOM_TURNERS) {
      alert(`줄잡이는 최대 ${MAX_CUSTOM_TURNERS}개까지만 등록할 수 있습니다. 기존 커스텀 줄잡이를 삭제 후 등록해 주세요.`);
      return;
    }
    if (uploadRole === "jumper" && customJumpers.length >= MAX_CUSTOM_JUMPERS) {
      alert(`점퍼는 최대 ${MAX_CUSTOM_JUMPERS}개까지만 등록할 수 있습니다. 기존 커스텀 점퍼를 삭제 후 등록해 주세요.`);
      return;
    }

    const newChar: CharacterItem = {
      id: `custom_${Date.now()}`,
      name: uploadName.trim(),
      role: uploadRole,
      description: `커스텀 ${uploadRole === "turner" ? "줄잡이" : "점퍼"} (${compressionInfo || "WebP 256px"})`,
      themeColor: "#8B5CF6",
      hairColor: "#4C1D95",
      outfitColor: "#6D28D9",
      avatarUrl: uploadPreview,
      isCustom: true,
    };

    try {
      await saveCustomCharacter(newChar, user ? user.uid : null);
      reloadRoster();

      // Auto select
      if (uploadRole === "turner") {
        handleSelectLeftTurner(newChar.id);
      } else {
        handleSelectJumper(newChar.id);
      }

      // Reset form
      setUploadName("");
      setUploadPreview(null);
      setCompressionInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setActiveTab(uploadRole === "turner" ? "turners" : "jumpers");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    if (confirm("이 커스텀 캐릭터를 삭제하시겠습니까? (삭제 시 기본 디폴트 캐릭터가 다시 복원됩니다)")) {
      await deleteCustomCharacter(id, user ? user.uid : null);
      reloadRoster();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(440px, 94vw)",
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        backdropFilter: "blur(14px)",
        borderLeft: "2px solid rgba(255, 215, 0, 0.35)",
        boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.65)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        color: "#FFFFFF",
        fontFamily: "'Outfit', 'Pretendard', sans-serif",
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(90deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={22} color="#FFD700" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>
            캐릭터 선택 & 업로드
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
          aria-label="닫기"
        >
          <X size={22} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(15, 23, 42, 0.6)",
        }}
      >
        <button
          onClick={() => setActiveTab("turners")}
          style={{
            flex: 1,
            padding: "12px 6px",
            background: activeTab === "turners" ? "rgba(59, 130, 246, 0.25)" : "transparent",
            border: "none",
            borderBottom: activeTab === "turners" ? "3px solid #3B82F6" : "3px solid transparent",
            color: activeTab === "turners" ? "#60A5FA" : "#94A3B8",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          줄잡이 ({turners.length})
        </button>
        <button
          onClick={() => setActiveTab("jumpers")}
          style={{
            flex: 1,
            padding: "12px 6px",
            background: activeTab === "jumpers" ? "rgba(249, 115, 22, 0.25)" : "transparent",
            border: "none",
            borderBottom: activeTab === "jumpers" ? "3px solid #F97316" : "3px solid transparent",
            color: activeTab === "jumpers" ? "#FB923C" : "#94A3B8",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          점퍼 ({jumpers.length})
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          style={{
            flex: 1,
            padding: "12px 6px",
            background: activeTab === "upload" ? "rgba(16, 185, 129, 0.25)" : "transparent",
            border: "none",
            borderBottom: activeTab === "upload" ? "3px solid #10B981" : "3px solid transparent",
            color: activeTab === "upload" ? "#34D399" : "#94A3B8",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            transition: "all 0.2s",
          }}
        >
          <Upload size={14} /> + 업로드
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Tab 1: Rope Turners */}
        {activeTab === "turners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: "#CBD5E1",
                padding: "10px 14px",
                background: "rgba(30, 41, 59, 0.6)",
                borderRadius: 10,
                border: "1px solid rgba(59, 130, 246, 0.3)",
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 800, color: "#60A5FA", marginBottom: 2 }}>
                🎯 줄잡이 4명 유지 (디폴트 {TOTAL_TURNERS_COUNT - turners.filter((t) => t.isCustom).length}명 + 커스텀 {turners.filter((t) => t.isCustom).length}명 / 최대 {MAX_CUSTOM_TURNERS}개)
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                왼쪽과 오른쪽에 배치할 2명의 줄잡이를 각각 선택하세요. 커스텀 줄잡이를 삭제하면 원래 디폴트 줄잡이가 자동으로 복원됩니다.
              </div>
            </div>

            {turners.map((char) => {
              const isLeft = selected.leftTurnerId === char.id;
              const isRight = selected.rightTurnerId === char.id;

              return (
                <div
                  key={char.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    background:
                      isLeft || isRight
                        ? "linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(15, 23, 42, 0.7) 100%)"
                        : "rgba(30, 41, 59, 0.4)",
                    border:
                      isLeft || isRight
                        ? "1.5px solid #60A5FA"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <img
                    src={avatarMap[char.id] || char.avatarUrl}
                    alt={char.name}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 10,
                      objectFit: "cover",
                      border: `2px solid ${char.themeColor}`,
                      backgroundColor: "#0F172A",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#FFFFFF" }}>
                        {char.name}
                      </span>
                      {char.isCustom && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "#8B5CF6",
                            color: "#FFFFFF",
                          }}
                        >
                          커스텀
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94A3B8",
                        margin: "4px 0 8px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {char.description}
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleSelectLeftTurner(char.id)}
                        className={`anime-btn sm ${isLeft ? "primary" : "dark"}`}
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          borderRadius: 6,
                          flex: 1,
                        }}
                      >
                        {isLeft ? "✓ 왼쪽 줄잡이" : "왼쪽 선택"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectRightTurner(char.id)}
                        className={`anime-btn sm ${isRight ? "primary" : "dark"}`}
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          borderRadius: 6,
                          flex: 1,
                        }}
                      >
                        {isRight ? "✓ 오른쪽 줄잡이" : "오른쪽 선택"}
                      </button>
                    </div>
                  </div>

                  {char.isCustom && (
                    <button
                      onClick={() => handleDeleteCustom(char.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                        padding: 4,
                      }}
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Jumpers */}
        {activeTab === "jumpers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: "#CBD5E1",
                padding: "10px 14px",
                background: "rgba(30, 41, 59, 0.6)",
                borderRadius: 10,
                border: "1px solid rgba(249, 115, 22, 0.3)",
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 800, color: "#FB923C", marginBottom: 2 }}>
                🎯 점퍼 10명 유지 (디폴트 {TOTAL_JUMPERS_COUNT - jumpers.filter((j) => j.isCustom).length}명 + 커스텀 {jumpers.filter((j) => j.isCustom).length}명 / 최대 {MAX_CUSTOM_JUMPERS}개)
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                플레이할 메인 점퍼 캐릭터를 선택하세요. 커스텀 점퍼를 삭제하면 원래 디폴트 점퍼가 자동으로 복원됩니다.
              </div>
            </div>

            {jumpers.map((char) => {
              const isSelected = selected.jumperId === char.id;

              return (
                <div
                  key={char.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(15, 23, 42, 0.7) 100%)"
                      : "rgba(30, 41, 59, 0.4)",
                    border: isSelected
                      ? "1.5px solid #F97316"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <img
                    src={avatarMap[char.id] || char.avatarUrl}
                    alt={char.name}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 10,
                      objectFit: "cover",
                      border: `2px solid ${char.themeColor}`,
                      backgroundColor: "#0F172A",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#FFFFFF" }}>
                        {char.name}
                      </span>
                      {char.isCustom && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "#8B5CF6",
                            color: "#FFFFFF",
                          }}
                        >
                          커스텀
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94A3B8",
                        margin: "4px 0 8px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {char.description}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectJumper(char.id)}
                      className={`anime-btn sm ${isSelected ? "accent-green" : "dark"}`}
                      style={{
                        padding: "5px 12px",
                        fontSize: 11,
                        borderRadius: 6,
                        width: "100%",
                      }}
                    >
                      {isSelected ? "✓ 사용 중인 점퍼" : "점퍼로 선택"}
                    </button>
                  </div>

                  {char.isCustom && (
                    <button
                      onClick={() => handleDeleteCustom(char.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                        padding: 4,
                      }}
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Upload Custom Character */}
        {activeTab === "upload" && (() => {
          const customTurners = turners.filter((t) => t.isCustom);
          const customJumpers = jumpers.filter((j) => j.isCustom);
          const currentSlotCount = uploadRole === "turner" ? customTurners.length : customJumpers.length;
          const maxSlotCount = uploadRole === "turner" ? MAX_CUSTOM_TURNERS : MAX_CUSTOM_JUMPERS;
          const isSlotFull = currentSlotCount >= maxSlotCount;

          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                background: "rgba(30, 41, 59, 0.4)",
                padding: 16,
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#34D399" }}>
                새 캐릭터 업로드 및 압축 보관
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94A3B8", lineHeight: 1.4 }}>
                업로드 시 자동으로 <b>가로·세로 256px 이하 + WebP 포맷 (품질 85%)</b>으로 압축되어 (25~35 KB) Firestore 및 브라우저에 저장됩니다.
              </p>

              {/* Slot Quota & Replacement Notice Banner */}
              <div
                style={{
                  padding: "10px 12px",
                  background: isSlotFull ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                  borderRadius: 8,
                  border: isSlotFull ? "1px solid #EF4444" : "1px solid rgba(59, 130, 246, 0.3)",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 800, color: isSlotFull ? "#F87171" : "#60A5FA", marginBottom: 2 }}>
                  {uploadRole === "turner" ? "줄잡이 슬롯" : "점퍼 슬롯"}: {currentSlotCount} / {maxSlotCount}개 사용 중
                </div>
                <div style={{ color: "#CBD5E1" }}>
                  {isSlotFull ? (
                    <span>⚠️ 슬롯이 모두 찼습니다. 새 캐릭터를 등록하려면 기존 커스텀 캐릭터를 삭제하세요.</span>
                  ) : (
                    <span>
                      새 캐릭터를 등록하면 디폴트 캐릭터 1명이 숨겨지며, 게임 내 캐릭터 수는 항상 <b>{uploadRole === "turner" ? "줄잡이 4명" : "점퍼 10명"}</b>으로 유지됩니다.
                    </span>
                  )}
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label style={{ fontSize: 12, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  캐릭터 역할 (Role)
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadRole("jumper");
                      setCompressionInfo(null);
                    }}
                    className={`anime-btn sm ${uploadRole === "jumper" ? "primary" : "dark"}`}
                    style={{ flex: 1, padding: "8px 0" }}
                  >
                    점퍼 (Jumper) · {customJumpers.length}/{MAX_CUSTOM_JUMPERS}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadRole("turner");
                      setCompressionInfo(null);
                    }}
                    className={`anime-btn sm ${uploadRole === "turner" ? "primary" : "dark"}`}
                    style={{ flex: 1, padding: "8px 0" }}
                  >
                    줄잡이 (Rope Turner) · {customTurners.length}/{MAX_CUSTOM_TURNERS}
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label style={{ fontSize: 12, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  캐릭터 이름
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="예: 마이 점퍼"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(15, 23, 42, 0.8)",
                    color: "#FFFFFF",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* File Upload Box */}
              <div>
                <label style={{ fontSize: 12, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  이미지 파일 선택 (자동 256px WebP 85% 압축)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  disabled={isSlotFull || isCompressing}
                  style={{ display: "none" }}
                />
                <div
                  onClick={() => {
                    if (!isSlotFull && !isCompressing) {
                      fileInputRef.current?.click();
                    }
                  }}
                  style={{
                    border: isSlotFull ? "2px dashed rgba(239, 68, 68, 0.4)" : "2px dashed rgba(52, 211, 153, 0.5)",
                    borderRadius: 10,
                    padding: "20px",
                    textAlign: "center",
                    cursor: isSlotFull ? "not-allowed" : "pointer",
                    background: isSlotFull ? "rgba(239, 68, 68, 0.05)" : "rgba(16, 185, 129, 0.08)",
                    opacity: isSlotFull ? 0.6 : 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Upload size={24} color={isSlotFull ? "#EF4444" : "#34D399"} />
                  <span style={{ fontSize: 13, color: "#E2E8F0" }}>
                    {isSlotFull
                      ? "슬롯 제한 초과 (새 캐릭터를 업로드하려면 기존 캐릭터 삭제 필요)"
                      : "클릭하여 이미지 파일 선택"}
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>
                    PNG, JPG, WebP 지원 (가로·세로 256px 이하 WebP 85% 자동 압축)
                  </span>
                </div>
              </div>

              {/* Compression Progress / Result Info */}
              {isCompressing && (
                <div
                  style={{
                    padding: "8px",
                    background: "rgba(59, 130, 246, 0.2)",
                    borderRadius: 6,
                    color: "#60A5FA",
                    fontSize: 12,
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  🔄 가로·세로 256px 이하 WebP 포맷(품질 85%)으로 자동 압축 중...
                </div>
              )}

              {compressionInfo && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(16, 185, 129, 0.2)",
                    borderRadius: 8,
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    color: "#34D399",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>압축 성공: {compressionInfo}</span>
                </div>
              )}

              {/* Preview Box */}
              {uploadPreview && (
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: "#94A3B8", display: "block", marginBottom: 6 }}>
                    최종 압축 미리보기
                  </span>
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 12,
                      objectFit: "contain",
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "2px solid #34D399",
                    }}
                  />
                </div>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveUpload}
                disabled={isSlotFull || isCompressing || !uploadPreview}
                className={`anime-btn ${isSlotFull ? "dark" : "accent-green"}`}
                style={{
                  marginTop: 8,
                  padding: "12px",
                  fontSize: 14,
                  fontWeight: 900,
                  width: "100%",
                  borderRadius: 8,
                  cursor: isSlotFull || !uploadPreview ? "not-allowed" : "pointer",
                  opacity: isSlotFull || !uploadPreview ? 0.6 : 1,
                }}
              >
                {isSlotFull
                  ? `⚠️ ${uploadRole === "turner" ? "줄잡이(최대 2개)" : "점퍼(최대 4개)"} 슬롯 가득 참`
                  : isCompressing
                  ? "압축 처리 중..."
                  : "캐릭터 등록 및 보관 완료"}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
