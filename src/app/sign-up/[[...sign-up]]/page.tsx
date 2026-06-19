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
        
        {/* Securely mapped Clerk form elements matching Reflect design system */}
        <SignUp 
          appearance={{
            elements: {
              footer: "hidden", // Completely hides the "Powered by Clerk" watermark!
              cardBox: "bg-transparent shadow-none border-none",
              card: "bg-[#060317]/95 border border-[#2e3038]/40 rounded-[24px] shadow-2xl p-6",
              headerTitle: "text-white text-lg font-medium tracking-tight",
              headerSubtitle: "text-[#9194a1] text-xs leading-relaxed",
              formButtonPrimary: "bg-[#10093a] border border-[#9382ff]/40 text-[#f4f0ff] hover:bg-[#9382ff]/20 rounded-[5px] text-xs font-semibold py-3 shadow transition-all duration-200",
              formFieldInput: "bg-[#08080a] border border-[#2e3038]/80 text-white rounded-[5px] text-xs py-2.5 focus:ring-1 focus:ring-[#9382ff]",
              formFieldLabel: "text-[#9194a1] text-xs font-semibold mb-1",
              socialButtonsBlockButton: "bg-[#08080a] border border-[#2e3038] hover:bg-[#1c1d22] text-[#e2e3e9] rounded-[5px] text-xs font-semibold py-2.5 transition-all duration-200",
              socialButtonsBlockButtonText: "text-[#e2e3e9] font-semibold",
              dividerLine: "bg-[#2e3038]/60",
              dividerText: "text-[#5e616e]",
              formFieldSuccessText: "text-emerald-500",
              formFieldErrorText: "text-rose-500",
              identityPreviewText: "text-[#9194a1]",
              identityPreviewEditButton: "text-[#9382ff] hover:text-[#f4f0ff]",
            }
          }}
        />
      </div>
    </div>
  );
}