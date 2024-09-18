import '../../styles/icons.css'

function FeatureCard(props) {
  const { icon, title, description } = props;

  return (
    <div className="min-h-72 col-span-6 xl:col-span-3 p-4 md:p-6 border drop-shadow-sm md:drop-shadow-lg bg-white rounded-lg flex flex-col md:gap-2">
      <span className={`icon icon-medium text-blue-700 ${icon}`}></span>
      <p className="text-lg font-semibold">{title}</p>
      <p className="">{description}</p>
    </div>
  );
}

export default FeatureCard;
