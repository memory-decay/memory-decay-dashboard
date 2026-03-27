import { redirect } from 'next/navigation';

export default function RootLayout({
  _children,
}: {
  _children: React.ReactNode;
}) {
  redirect('/ko');
}
