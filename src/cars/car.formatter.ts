// Transforma un registro Car de Prisma al formato que espera el frontend.
export function formatCar(car: any) {
  const imageUrls: string[] = car.images?.map((img: any) => img.url) ?? [];
  const primaryImage =
    car.images?.find((img: any) => img.isPrimary)?.url ?? imageUrls[0] ?? null;

  return {
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    price: car.price,
    km: car.km,
    bodyType: car.bodyType,
    location: car.location,
    transmission: car.transmission,
    fuel: car.fuel,
    description: car.description,
    image: primaryImage,
    images: imageUrls,
    color: car.color,
    doors: car.doors,
    engine: car.engine,
    status: car.status,
    aiStatus: car.aiStatus,
    aiDamages: car.aiDamages,
    aiPriceMin: car.aiPriceMin,
    aiPriceMax: car.aiPriceMax,
    aiScore: car.aiScore,
    views: car.views,
    contacts: car.contacts,
    sellerId: car.sellerId,
    sellerEmail: car.seller?.email ?? null,
    sellerName: car.seller
      ? `${car.seller.nombre} ${car.seller.apellido}`
      : null,
    seller: car.seller ? {
      email: car.seller.email,
      nombre: car.seller.nombre,
      apellido: car.seller.apellido,
      telefono: car.seller.telefono
    } : null,
    createdAt: car.createdAt,
  };
}
