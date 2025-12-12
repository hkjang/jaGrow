'use client';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin 레이아웃이 이미 사이드바를 제공하므로 children만 반환
  return <>{children}</>;
}
