export function LogoLTRecept({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* LT hexagonal icon */}
      <path
        d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
        fill="currentColor"
        stroke="var(--background)"
        strokeWidth="2"
      />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fill="var(--primary-foreground)"
        fontSize="16"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {import.meta.env.VITE_APP_INITIALS}
      </text>
      
      {/* LT-Recept text */}
      <text
        x="54"
        y="20"
        fill="currentColor"
        fontSize="16"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {import.meta.env.VITE_APP_NAME}
      </text>
      
      {/* Gestion Réception subtitle */}
      <text
        x="54"
        y="36"
        fill="currentColor"
        fontSize="10"
        opacity="0.8"
        fontFamily="system-ui, sans-serif"
      >
        Gestion Réception
      </text>
    </svg>
  );
}

export function LogoLTReceptCompact({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* LT hexagonal icon */}
      <path
        d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
        fill="currentColor"
        stroke="var(--background)"
        strokeWidth="2"
      />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fill="var(--primary-foreground)"
        fontSize="16"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {import.meta.env.VITE_APP_INITIALS}
      </text>
    </svg>
  );
}
