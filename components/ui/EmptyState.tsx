type EmptyStateProps = {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ emoji = "🍽️", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
      <span className="text-5xl">{emoji}</span>
      <h3 className="text-lg font-semibold text-coffee">{title}</h3>
      {description && <p className="text-sm text-coffee/50 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
