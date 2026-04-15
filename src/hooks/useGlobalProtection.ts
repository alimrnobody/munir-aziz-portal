import { useEffect } from "react";

export const useGlobalProtection = () => {
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    const handleSelectStart = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const shouldBlock =
        key === "f12" ||
        (event.ctrlKey && key === "u") ||
        (event.ctrlKey && event.shiftKey && ["i", "j"].includes(key));

      if (shouldBlock) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("selectstart", handleSelectStart, true);
    document.addEventListener("selectstart", handleSelectStart, true);
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("selectstart", handleSelectStart, true);
      document.removeEventListener("selectstart", handleSelectStart, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);
};
