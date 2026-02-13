export const services = [
  {
    id: "cooking",
    name: "Cooking",
    icon: "🍲",
    price: 249,
    arrival: "Arrives in 15 mins"
  },
  {
    id: "electrician",
    name: "Electrician",
    icon: "💡",
    price: 399,
    arrival: "Arrives in 15 mins"
  },
  {
    id: "plumber",
    name: "Plumber",
    icon: "🔧",
    price: 349,
    arrival: "Arrives in 15 mins"
  },
  {
    id: "misc",
    name: "Misc",
    icon: "🧰",
    price: 299,
    arrival: "Arrives in 15 mins"
  }
];

export function findServiceById(id) {
  return services.find((service) => service.id === id);
}
