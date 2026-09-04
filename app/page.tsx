import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-[#7e82e8] via-[#8c91f0] to-[#9fa5f0]">
      <LoginForm />
    </main>
  );
}
