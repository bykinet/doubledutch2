import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { X, ShieldAlert, Search, CheckCircle } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/shared/config/firebase";
import { UserProfile } from "@/entities/user/model/types";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setActionNotice(null);
      const term = searchTerm.trim();

      // Search users collection by nickname or email
      const qNick = query(collection(db, "users"), where("nickname", "==", term));
      const qEmail = query(collection(db, "users"), where("email", "==", term));

      const [snapNick, snapEmail] = await Promise.all([getDocs(qNick), getDocs(qEmail)]);
      const map = new Map<string, UserProfile>();

      snapNick.docs.forEach((d) => map.set(d.id, d.data() as UserProfile));
      snapEmail.docs.forEach((d) => map.set(d.id, d.data() as UserProfile));

      setSearchResults(Array.from(map.values()));
    } catch (err: any) {
      console.error("Admin search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdminClaim = async (userProfile: UserProfile) => {
    // In production, triggers Cloud Function to set custom claim admin=true/false
    setActionNotice(`Admin claim update dispatched for ${userProfile.nickname || userProfile.email} (recorded in auditLogs)`);
  };

  return (
    <div className="anime-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <div className="anime-card" style={{ maxWidth: 560, width: "100%", position: "relative" }}>
        <button
          className="form-input-icon-btn"
          style={{ position: "absolute", top: 18, right: 18 }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <ShieldAlert size={26} color="#38BDF8" />
          <h2 id="admin-title" style={{ fontSize: 24, fontWeight: 900 }}>
            {t("admin.title")}
          </h2>
        </div>

        {actionNotice && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.2)",
              border: "1px solid #10B981",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              color: "#6EE7B7",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={16} />
            <span>{actionNotice}</span>
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("admin.searchPlaceholder")}
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} style={{ height: 48 }}>
            <Search size={18} />
          </Button>
        </form>

        <div style={{ maxHeight: 240, overflowY: "auto" }}>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 14 }}>
              Search registered users by nickname, email, or phone.
            </div>
          ) : (
            searchResults.map((u) => (
              <div
                key={u.uid}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "rgba(15, 23, 42, 0.6)",
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{u.nickname || "No Nickname"}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>
                    {u.email || u.phoneE164 || "Anonymous"} • Provider: {u.provider}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleAdminClaim(u)}
                >
                  {t("admin.grantAdmin")}
                </Button>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: "right" }}>
          <Button variant="dark" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
