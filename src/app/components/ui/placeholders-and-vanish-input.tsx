import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowUp } from "lucide-react";

interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  value?: string;
  disabled?: boolean;
}

export const PlaceholdersAndVanishInput: React.FC<PlaceholdersAndVanishInputProps> = ({
  placeholders,
  onChange,
  onSubmit,
  value: externalValue,
  disabled = false,
}) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [value, setValue] = useState(externalValue || "");
  const [animating, setAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);

  // Sync external value
  useEffect(() => {
    if (externalValue !== undefined) {
      setValue(externalValue);
    }
  }, [externalValue]);

  // Cycle placeholders automatically every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Canvas particle vanishing animation
  const drawVanishParticles = useCallback(() => {
    if (!inputRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = inputRef.current.offsetWidth;
    canvas.height = inputRef.current.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const computed = window.getComputedStyle(inputRef.current);
    ctx.font = `${computed.fontSize} ${computed.fontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(value, 20, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;
    const particles: any[] = [];

    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const index = (y * canvas.width + x) * 4;
        if (pixelData[index + 3] > 100) {
          particles.push({
            x,
            y,
            r: Math.random() * 2 + 1,
            color: `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            opacity: 1,
          });
        }
      }
    }
    newDataRef.current = particles;

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      newDataRef.current.forEach((p) => {
        if (p.opacity > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.opacity -= 0.04;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fill();
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAnimating(false);
      }
    };

    setAnimating(true);
    render();
  }, [value]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;

    drawVanishParticles();
    onSubmit(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!animating) {
      setValue(e.target.value);
      if (onChange) onChange(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-4xl mx-auto h-14 rounded-2xl bg-zinc-900 border border-white/15 hover:border-white/30 focus-within:border-white transition-all shadow-xl flex items-center overflow-hidden"
    >
      {/* Canvas Layer for Vanish Animation */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-20"
      />

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        disabled={disabled || animating}
        className={`w-full h-full bg-transparent px-6 pr-14 text-white font-mono text-xs focus:outline-none z-10 transition-opacity ${
          animating ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Animated Rotating Placeholder */}
      {!value && (
        <div className="pointer-events-none absolute left-6 top-0 bottom-0 flex items-center z-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPlaceholder}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 0.4 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-xs text-zinc-400 truncate max-w-xl"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="absolute right-2.5 z-30 w-9 h-9 rounded-xl bg-white text-black font-bold flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 transition-all cursor-pointer shadow-md"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </form>
  );
};
