import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#030014] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background starlit glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#9382ff]/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        {/* Custom Logo Mark */}
        <div className="w-10 h-10 flex items-center justify-center bg-[#000000] border border-[#2e3038]/60 rounded-[5px] text-[#f4f0ff] font-medium text-lg mb-3">
          N
        </div>
        <h2 className="text-lg font-medium text-[#f4f0ff] tracking-tight mb-6">Create NGO Account</h2>
        
        <SignUp 
          appearance={{
            layout: {
              unsafe_disableDevelopmentModeWarnings: true, // Natively disables Clerk development warning badges!
            },
            variables: {
              colorPrimary: "#9382ff", // Lavender Accent!
              colorBackground: "#060317", // Midnight Surface!
              colorForeground: "#f4f0ff", // Lilac White text!
              colorMutedForeground: "#a8a6b7", // Ash muted text!
              colorInput: "#030014", // Void Canvas input fills!
              colorInputForeground: "#ffffff",
              borderRadius: "5px", // Reflect button/input radius!
            },
            elements: {
              footer: "hidden", // Completely hides the bottom copyright footer!
              cardBox: "bg-transparent shadow-none border-none",
              card: "border border-[#54525f]/50 rounded-[16px] shadow-2xl p-6 bg-[#060317]", // High-contrast border!
              socialButtonsBlockButton: "bg-[#030014] border border-[#54525f]/60 hover:bg-[#121317] text-[#e2e3e9] rounded-[5px] transition-all duration-200",
              formFieldInput: "bg-[#030014] border border-[#54525f]/60 text-white rounded-[5px]",
              dividerLine: "bg-[#54525f]/40",
            }
          }}
        />
      </div>
    </div>
  );
}