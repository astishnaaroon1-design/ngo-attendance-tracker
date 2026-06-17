import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm mb-4">
          N
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-6">Create NGO Account</h2>
        <SignUp />
      </div>
    </div>
  );
}