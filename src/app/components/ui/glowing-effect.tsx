import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface GlowingEffectProps {
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
}

export const GlowingEffect: React.FC<GlowingEffectProps> = ({
  spread = 40,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  borderWidth = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check proximity bounds
      if (
        x >= -proximity &&
        x <= rect.width + proximity &&
        y >= -proximity &&
        y <= rect.height + proximity
      ) {
        setMousePosition({ x, y });
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [disabled, proximity]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        opacity: isHovered ? 1 : 0,
      }}
    >
      {/* Outer Glowing Radial Border */}
      <div
        className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          background: `radial-gradient(${spread * 4}px circle at ${mousePosition.x}px ${
            mousePosition.y
          }px, rgba(52, 211, 153, 0.4), rgba(255, 255, 255, 0.15) 40%, transparent 80%)`,
          maskImage: `linear-gradient(#black, #black) content-box, linear-gradient(#black, #black)`,
          WebkitMask: `radial-gradient(${spread * 3}px circle at ${mousePosition.x}px ${
            mousePosition.y
          }px, #black 0%, transparent 100%)`,
        }}
      />

      {/* Subtle Inner Glow */}
      {glow && (
        <div
          className="absolute inset-0 rounded-[inherit] mix-blend-screen opacity-50"
          style={{
            background: `radial-gradient(${spread * 2.5}px circle at ${mousePosition.x}px ${
              mousePosition.y
            }px, rgba(52, 211, 153, 0.15), transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};
