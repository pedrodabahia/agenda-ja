import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";
const STORAGE_KEY = "af-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

// Tema simples: dark (padrão) e light.
// O Produto 2 pode expandir pra mais opções (temas por cor, custom, etc.)
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      className="af-theme-toggle"
      style={styles.button}
    >
      {theme === "dark" ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text-dim)",
    cursor: "pointer",
  },
};
