export const services = [
  {
    id: "cooking",
    name: "Cooking",
    icon: "🍲",
    price: 249,
    arrival: "Arrives in 15 mins",
    color: "bg-purple-100"
  },
  {
    id: "cleaning",
    name: "Cleaning",
    icon: "🧹",
    price: 249,
    arrival: "Arrives in 15 mins",
    color: "bg-blue-100"
  },
  {
    id: "repair",
    name: "Repair",
    icon: "🔧",
    price: 399,
    arrival: "Arrives in 15 mins",
    color: "bg-blue-100"
  },
  {
    id: "painting",
    name: "Painting",
    icon: "🎨",
    price: 349,
    arrival: "Arrives in 15 mins",
    color: "bg-orange-100"
  },
  {
    id: "shifting",
    name: "Shifting",
    icon: "📦",
    price: 499,
    arrival: "Arrives in 15 mins",
    color: "bg-green-100"
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: "🚰",
    price: 349,
    arrival: "Arrives in 15 mins",
    color: "bg-pink-100"
  },
  {
    id: "electric",
    name: "Electric",
    icon: "💡",
    price: 399,
    arrival: "Arrives in 15 mins",
    color: "bg-yellow-100"
  }
];

export function findServiceById(id) {
  return services.find((service) => service.id === id);
}
