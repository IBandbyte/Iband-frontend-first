// src/Submit.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, API_BASE } from "./services/api";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function cleanUrl(v) {
  const s = safeText(v).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{label}</div>
      {children}
      {hint ? (
        <div style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>{hint}</div>
      ) : null}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "14px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        outline: "none",
        fontSize: 16,
        ...(props.style || {}),
      }}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: "14px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        outline: "none",
        fontSize: 16,
        minHeight: 120,
        resize: "vertical",
        ...(props.style || {}),
      }}
    />
  );
}

function PrimaryBtn({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 16,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(90deg, rgba(154,74,255,0.95), rgba(255,147,43,0.95))",
        color: "black",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.8 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SoftBtn({ children, to, onClick, disabled, type = "button" }) {
  const style = {
    textDecoration: "none",
    borderRadius: 16,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    display: "inline-block",
  };

  if (to) return <Link to={to} style={style}>{children}</Link>;

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

export default function Submit() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [spotify, setSpotify] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [website, setWebsite] = useState("");

  const [track1Title, setTrack1Title] = useState("");
  const [track1Url, setTrack1Url] = useState("");
  const [track1Platform, setTrack1Platform] = useState("");

  const [track2Title, setTrack2Title] = useState("");
  const [track2Url, setTrack2Url] = useState("");
  const [track2Platform, setTrack2Platform] = useState("");

  const [track3Title, setTrack3Title] = useState("");
  const [track3Url, setTrack3Url] = useState("");
  const [track3Platform, setTrack3Platform] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const canSubmit = useMemo(() => {
    return safeText(name).trim().length >= 2 && safeText(bio).trim().length >= 10;
  }, [name, bio]);

  function buildPayload() {
    const tracks = [
      { title: track1Title, url: track1Url, platform: track1Platform },
      { title: track2Title, url: track2Url, platform: track2Platform },
      { title: track3Title, url: track3Url, platform: track3Platform },
    ]
      .map((t) => ({
        title: safeText(t.title).trim(),
        url: cleanUrl(t.url),
        platform: safeText(t.platform).trim(),
      }))
      .filter((t) => t.title || t.url);

    return {
      name: safeText(name).trim(),
      genre: safeText(genre).trim(),
      location: safeText(location).trim(),
      bio: safeText(bio).trim(),
      imageUrl: cleanUrl(imageUrl),

      socials: {
        instagram: cleanUrl(instagram),
        tiktok: cleanUrl(tiktok),
        youtube: cleanUrl(youtube),
        spotify: cleanUrl(spotify),
        soundcloud: cleanUrl(soundcloud),
        website: cleanUrl(website),
      },

      tracks,

      // backend will enforce pending for public submissions
      status: "pending",
      source: "web",
    };
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = buildPayload();
      const res = await api.submitArtist(payload);

      const data =
        (res && res.artist && typeof res.artist === "object" && res.artist) ||
        (res && res.data && typeof res.data === "object" && res.data) ||
        (res && typeof res === "object" && res) ||
        null;

      const newId = safeText(data?.id || data?._id || data?.slug || "");
      setSuccessMsg(
        newId
          ? `Submitted successfully ✅ (ID: ${newId}). Status: pending`
          : "Submitted successfully ✅. Status: pending"
      );

      setTimeout(() => {
        nav("/artists");
      }, 900);
    } catch (err) {
      setError(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function clearAll() {
    setName("");
    setGenre("");
    setLocation("");
    setBio("");
    setImageUrl("");

    setInstagram("");
    setTiktok("");
    setYoutube("");
    setSpotify("");
    setSoundcloud("");
    setWebsite("");

    setTrack1Title("");
    setTrack1Platform("");
    setTrack1Url("");

    setTrack2Title("");
    setTrack2Platform("");
    setTrack2Url("");

    setTrack3Title("");
    setTrack3Platform("");
    setTrack3Url("");

    setError("");
    setSuccessMsg("");
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ fontSize: 52, margin: 0, letterSpacing: -1 }}>Submit Artist</h1>
      <p style={{ opacity: 0.85, marginTop: 10 }}>
        Send your profile for approval • API: {API_BASE}
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SoftBtn to="/artists">← Back to Artists</SoftBtn>
        <SoftBtn to="/admin">Admin</SoftBtn>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,64,64,0.35)",
            background: "rgba(120,0,0,0.20)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>Error</div>
          <div style={{ opacity: 0.9, marginTop: 6 }}>{error}</div>
        </div>
      ) : null}

      {successMsg ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(80,255,160,0.25)",
            background: "rgba(0,80,40,0.20)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>Success</div>
          <div style={{ opacity: 0.92, marginTop: 6 }}>{successMsg}</div>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 18,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.35)",
          padding: 18,
          boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
        }}
      >
        <Field label="Artist Name" hint="Required (min 2 chars)">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Demo Artist" />
        </Field>

        <Field label="Genre">
          <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Pop / Urban" />
        </Field>

        <Field label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" />
        </Field>

        <Field label="Bio" hint="Required (min 10 chars)">
          <TextArea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell fans + labels what makes you different…" />
        </Field>

        <Field label="Profile Image URL" hint="Paste a public image link (optional)">
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </Field>

        <div style={{ marginTop: 22, fontWeight: 900, fontSize: 18 }}>Socials (optional)</div>

        <Field label="Instagram">
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="instagram.com/..." />
        </Field>

        <Field label="TikTok">
          <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="tiktok.com/@..." />
        </Field>

        <Field label="YouTube">
          <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="youtube.com/..." />
        </Field>

        <Field label="Spotify">
          <Input value={spotify} onChange={(e) => setSpotify(e.target.value)} placeholder="open.spotify.com/..." />
        </Field>

        <Field label="SoundCloud">
          <Input value={soundcloud} onChange={(e) => setSoundcloud(e.target.value)} placeholder="soundcloud.com/..." />
        </Field>

        <Field label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourwebsite.com" />
        </Field>

        <div style={{ marginTop: 22, fontWeight: 900, fontSize: 18 }}>
          Tracks (optional — up to 3)
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Track 1</div>
          <Input value={track1Title} onChange={(e) => setTrack1Title(e.target.value)} placeholder="Title" />
          <div style={{ height: 10 }} />
          <Input value={track1Platform} onChange={(e) => setTrack1Platform(e.target.value)} placeholder="Platform (mp3 / YouTube / Spotify)" />
          <div style={{ height: 10 }} />
          <Input value={track1Url} onChange={(e) => setTrack1Url(e.target.value)} placeholder="Link (https://...)" />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Track 2</div>
          <Input value={track2Title} onChange={(e) => setTrack2Title(e.target.value)} placeholder="Title" />
          <div style={{ height: 10 }} />
          <Input value={track2Platform} onChange={(e) => setTrack2Platform(e.target.value)} placeholder="Platform (mp3 / YouTube / Spotify)" />
          <div style={{ height: 10 }} />
          <Input value={track2Url} onChange={(e) => setTrack2Url(e.target.value)} placeholder="Link (https://...)" />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Track 3</div>
          <Input value={track3Title} onChange={(e) => setTrack3Title(e.target.value)} placeholder="Title" />
          <div style={{ height: 10 }} />
          <Input value={track3Platform} onChange={(e) => setTrack3Platform(e.target.value)} placeholder="Platform (mp3 / YouTube / Spotify)" />
          <div style={{ height: 10 }} />
          <Input value={track3Url} onChange={(e) => setTrack3Url(e.target.value)} placeholder="Link (https://...)" />
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <PrimaryBtn type="submit" disabled={!canSubmit || submitting}>
            {submitting ? "Submitting…" : "Submit for Approval"}
          </PrimaryBtn>

          <SoftBtn onClick={clearAll} disabled={submitting}>
            Clear
          </SoftBtn>
        </div>

        <div style={{ opacity: 0.7, marginTop: 14, fontSize: 13 }}>
          Note: submission is saved as <b>pending</b>. Next phase adds Admin approval + moderation.
        </div>
      </form>
    </div>
  );
}