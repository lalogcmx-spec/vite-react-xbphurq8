import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function ProductosPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionTitle title="Productos" subtitle={`${PRODUCTS.length} productos · ${CATEGORIES.length} categorías`} />
        <Button variant="gold" size="sm">+ Nuevo producto</Button>
      </div>
      {CATEGORIES.map((cat) => {
        const catProducts = PRODUCTS.filter((p) => p.categoryId === cat.id);
        return (
          <div key={cat.id}>
            <h3 className="font-semibold text-coffee mb-3 flex items-center gap-2">
              {cat.emoji} {cat.name}
              <span className="text-xs text-coffee/40 font-normal">({catProducts.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catProducts.map((p) => (
                <Card key={p.id} padding="md">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{p.imageEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-coffee text-sm truncate">{p.name}</h4>
                        {!p.available && <Badge variant="terracotta">No disponible</Badge>}
                      </div>
                      <p className="text-xs text-coffee/50 mt-0.5 line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="font-bold text-coffee">${p.price}</span>
                        {p.tags?.map((t) => <Badge key={t} variant="gold">{t}</Badge>)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
