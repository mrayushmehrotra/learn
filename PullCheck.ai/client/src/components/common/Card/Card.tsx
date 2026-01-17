import type { ReactNode, CSSProperties } from 'react';
import './Card.css';

interface CardProps {
    children: ReactNode;
    variant?: 'default' | 'bordered' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
    hoverable?: boolean;
}

export function Card({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    style,
    onClick,
    hoverable = false,
}: CardProps) {
    const classes = [
        'card',
        `card--${variant}`,
        `card--padding-${padding}`,
        hoverable ? 'card--hoverable' : '',
        onClick ? 'card--clickable' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined} style={style}>
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function CardHeader({ children, className = '', style }: CardHeaderProps) {
    return <div className={`card__header ${className}`} style={style}>{children}</div>;
}

interface CardBodyProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function CardBody({ children, className = '', style }: CardBodyProps) {
    return <div className={`card__body ${className}`} style={style}>{children}</div>;
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function CardFooter({ children, className = '', style }: CardFooterProps) {
    return <div className={`card__footer ${className}`} style={style}>{children}</div>;
}

export default Card;
