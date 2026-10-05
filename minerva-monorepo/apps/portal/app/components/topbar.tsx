export default function Topbar({ section }: { section: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-6 py-3 md:px-10">
      <p className="font-mono text-[11px] tracking-[2px] text-white/70 uppercase">
        <span className="text-white/30">//</span> {section}
      </p>
    </div>
  );
}
