import React, { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  username?: string | null;
  /** Optional text override for the fallback content. */
  fallback?: string;
  /** Optional accessible label. */
  alt?: string;
  /** Desired square size in pixels. */
  size?: number;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  style?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  fallbackStyle?: React.CSSProperties;
};

const DEFAULT_FALLBACK = "👤";

const computeInitials = (name?: string | null, username?: string | null): string => {
  const primary = (name ?? "").trim();
  const secondary = (username ?? "").trim();
  const source = primary || secondary;
  if (!source) {
    return DEFAULT_FALLBACK;
  }

  const normalized = source.replace(/[_-]+/g, " ");
  const letters = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return letters || DEFAULT_FALLBACK;
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  username,
  fallback,
  alt,
  size,
  className,
  imageClassName,
  fallbackClassName,
  style,
  imageStyle,
  fallbackStyle,
}) => {
  const fallbackContent = useMemo(() => {
    if (fallback && fallback.trim().length > 0) {
      return fallback.trim();
    }
    return computeInitials(name, username);
  }, [fallback, name, username]);

  const rootStyle = {
    ...(typeof size === "number" ? { width: size, height: size } : {}),
    ...(style ?? {}),
  } as React.CSSProperties;

  const resolvedAlt = alt ?? (name ? `Foto de ${name}` : "Foto de perfil");

  return (
    <Avatar className={className} style={rootStyle}>
      {src ? (
        <AvatarImage
          src={src}
          alt={resolvedAlt}
          className={cn(imageClassName)}
          style={imageStyle}
        />
      ) : null}
      <AvatarFallback className={cn(fallbackClassName)} style={fallbackStyle}>
        {fallbackContent}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
