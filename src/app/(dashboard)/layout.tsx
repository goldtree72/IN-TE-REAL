import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                display: 'flex',
                height: '100vh',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
            }}
        >
            <Sidebar />
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <Header />
                <main
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px 28px',
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
