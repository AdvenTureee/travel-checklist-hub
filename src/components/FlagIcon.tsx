import React from "react";

interface FlagIconProps {
  country: "br" | "es" | "us";
  size?: number;
  className?: string;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ country, size = 32, className = "" }) => {
  // Minimalist SVGs
  if (country === "br") {
    // Brasil: verde fundo, losango amarelo rotacionado, círculo azul menor e faixa branca
    return (
      <svg width={size} height={size * 0.7} viewBox="0 0 48 32" className={className} style={{ borderRadius: 4 }}>
        <rect x="0" y="0" width="48" height="32" fill="#12ad2b" />
        <polygon points="24,4 44,16 24,28 4,16" fill="#ffe600" />
        <circle cx="24" cy="16" r="6" fill="#3e4095" />
        <ellipse cx="24" cy="16" rx="6" ry="1.5" fill="#fff" transform="rotate(-15 24 16)" />
      </svg>
    );
  }
  if (country === "es") {
    // Espanha: vermelho, amarelo, vermelho (faixas)
    return (
      <svg width={size} height={size * 0.7} viewBox="0 0 48 32" className={className} style={{ borderRadius: 4 }}>
        <rect x="0" y="0" width="48" height="32" fill="#c60b1e" />
        <rect x="0" y="8" width="48" height="16" fill="#ffc400" />
      </svg>
    );
  }
  // EUA: faixas horizontais vermelhas/brancas e retângulo azul com estrelas minimalistas
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 48 32" className={className} style={{ borderRadius: 4 }}>
      {/* 7 faixas vermelhas */}
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} x="0" y={y * 2} width="48" height="2" fill="#b22234" />
      ))}
      {/* fundo branco */}
      <rect x="0" y="0" width="48" height="32" fill="none" />
      {/* retângulo azul */}
      <rect x="0" y="0" width="14" height="14" fill="#3c3b6e" />
      {/* estrelas minimalistas (pontos brancos) */}
      {[2, 6, 10].map((y, i) => (
        [3, 7, 11].map((x, j) => (
          <circle key={i + '-' + j} cx={x} cy={y} r="0.7" fill="#fff" />
        ))
      ))}
    </svg>
  );
};
