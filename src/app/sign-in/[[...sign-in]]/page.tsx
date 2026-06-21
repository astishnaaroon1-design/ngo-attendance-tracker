import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background soft glow flares */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        {/* Custom Logo Mark */}
        <div className="w-10 h-10 flex items-center justify-center bg-[#ffffff] border border-[#059669] rounded-[8px] text-[#059669] font-bold text-xl shadow-sm mb-3">
          N
        </div>
        <h2 className="text-lg font-bold text-[#0f172a] tracking-tight mb-6">NGO Attendance Portal</h2>
        
        <SignIn 
          appearance={{
            variables: {
              colorPrimary: "#059669", // Emerald Green!
              colorBackground: "#ffffff", // Pure White Card!
              colorForeground: "#0f172a", // Slate-900 Primary Text!
              colorMutedForeground: "#475569", // Slate-600 Secondary Text!
              colorInput: "#f8fafc", // Light Gray Input backgrounds!
              colorInputForeground: "#0f172a",
              borderRadius: "8px",
            },
            elements: {
              footer: "hidden", // Completely hides the bottom copyright footer!
              cardBox: "bg-transparent shadow-none border-none",
              card: "border border-[#cbd5e1] rounded-[24px] shadow-xl shadow-slate-100 p-6",
              socialButtonsBlockButton: "bg-[#ffffff] border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#0f172a] rounded-[8px] transition-all duration-200",
              formFieldInput: "bg-[#f8fafc] border border-[#cbd5e1] text-[#0f172a] rounded-[8px]",
              dividerLine: "bg-[#cbd5e1]/60",
            }
          }}
        />
      </div>
    </div>
  );
}