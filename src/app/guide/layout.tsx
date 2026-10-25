import GuideFooter from "@/components/GuideFooter";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GuideFooter />
    </>
  );
}
