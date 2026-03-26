import "../../styles/icons.css";

function FeatureCard(props) {
  const { icon, title, children, href } = props;

  const cardClasses =
    "min-h-72 col-span-1 xl:col-span-1 p-4 md:p-6 border drop-shadow-sm md:drop-shadow-lg bg-white rounded-lg flex flex-col md:gap-2";

  const content = (
    <>
      <span className={`icon icon-medium text-blue-700 ${icon}`}></span>
      <p className="text-lg font-semibold">{title}</p>
      <p>{children}</p>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`${cardClasses} hover:border-blue-700 hover:shadow-xl transition-all duration-200 no-underline text-inherit`}
      >
        {content}
      </a>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}

export default FeatureCard;
