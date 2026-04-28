type TenantBrandMarkProps = {
  label: string;
  logoUrl: string | null;
  primaryColor: string;
};

export function TenantBrandMark({
  label,
  logoUrl,
  primaryColor
}: TenantBrandMarkProps): React.JSX.Element {
  const backgroundStyle = logoUrl
    ? {
        backgroundImage: `url(${logoUrl})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain"
      }
    : {
        backgroundColor: primaryColor
      };

  return (
    <span
      aria-label={`${label} logo`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-white"
      style={backgroundStyle}
    >
      {logoUrl ? null : initials(label)}
    </span>
  );
}

function initials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "P";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
