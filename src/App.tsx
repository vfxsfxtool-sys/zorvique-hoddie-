import { ShoppingBag, Shield, ExternalLink, Sparkles, Database } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#E4E2E1] flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(158,11,20,0.15),transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl text-center space-y-8 p-8 rounded-3xl border border-white/10 bg-[#141416]/80 backdrop-blur-xl shadow-2xl">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9E0B14] text-white font-serif font-bold text-3xl shadow-lg shadow-[#9E0B14]/30">
            Z
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <Database className="h-3.5 w-3.5" />
            <span>Supabase Production Connected</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white">
            Zorvique Luxury Studio &amp; Storefront
          </h1>
          <p className="text-sm text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
            Architectural heavyweight fleece hoodies engineered in Pakistan. Access the customer shopping experience or the secure Supabase admin operations center below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <a
            href="http://localhost:3000"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#1C1D1E] p-6 hover:border-[#9E0B14] hover:bg-[#202122] transition-all shadow-md cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9E0B14]/20 text-[#9E0B14] group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-white text-sm">Customer Storefront</h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Shop luxury hoodies &amp; 3D atelier</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9E0B14] mt-1">
              <span>Launch Store</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>

          <a
            href="http://localhost:3001/admin"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#1C1D1E] p-6 hover:border-[#FF7A00] hover:bg-[#202122] transition-all shadow-md cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF7A00]/20 text-[#FF7A00] group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-white text-sm">Admin Control Center</h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Orders, products &amp; Supabase RLS</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#FF7A00] mt-1">
              <span>Launch Admin</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        </div>

        <div className="pt-4 border-t border-white/10 text-xs text-[#71717A]">
          Connected to Supabase Project: <code className="text-[#E4E2E1] font-mono">zzxkrmsfradeeswqzhfr</code>
        </div>
      </div>
    </div>
  );
}
