"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="fixed bottom-4 right-4 gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
    >
      {isFullscreen ? (
        <>
          <Minimize2 className="h-4 w-4" />
          Exit Fullscreen
        </>
      ) : (
        <>
          <Maximize2 className="h-4 w-4" />
          Fullscreen
        </>
      )}
    </Button>
  );
}
