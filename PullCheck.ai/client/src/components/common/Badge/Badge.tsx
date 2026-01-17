import type { Severity } from '@/types';
import './Badge.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | Severity;
    size?: 'sm' | 'md';
    className?: string;
}

const variantMap: Record<Severity, string> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info',
    suggestion: 'default',
};

export function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}: BadgeProps) {
    const mappedVariant = variantMap[variant as Severity] ?? variant;

    const classes = [
        'badge',
        `badge--${mappedVariant}`,
        `badge--${size}`,
        className,
    ].filter(Boolean).join(' ');

    return <span className={classes}>{children}</span>;
}

export default Badge;
