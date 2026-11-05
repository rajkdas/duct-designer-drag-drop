// Rebuilds the demo design after seed changes (run with `bun scripts/reseed-demo.ts`)
import { db } from '../src/lib/db'
import { buildDemoDesign } from '../src/lib/seed'

async function main() {
  const demo = await db.design.findUnique({ where: { shareId: 'demo' }, include: { quotes: true } })
  if (demo) {
    for (const q of demo.quotes) await db.quoteRequest.delete({ where: { id: q.id } })
    await db.design.delete({ where: { shareId: 'demo' } })
    console.log('old demo design removed')
  }
  const products = await db.product.findMany()
  const data = buildDemoDesign(products)
  const byId = new Map(products.map((p) => [p.id, p.price]))
  const net = data.items.reduce((s, it) => s + (it.productId ? (byId.get(it.productId) ?? 0) : 0), 0)
  const created = await db.design.create({
    data: {
      shareId: 'demo',
      name: 'Sample workshop 18 × 12 m',
      customer: 'Schreinerei Muster',
      data: JSON.stringify(data),
      itemCount: data.items.length,
      totalNet: Math.round(net * 100) / 100,
      totalGross: Math.round(net * 1.19 * 100) / 100,
    },
  })
  await db.quoteRequest.create({
    data: {
      designId: created.id,
      name: 'Markus Muster',
      company: 'Schreinerei Muster',
      email: 'muster@example.de',
      phone: '+49 170 000000',
      message: 'Please confirm availability for week 12 and include installation.',
      totalGross: Math.round(net * 1.19 * 100) / 100,
      status: 'NEW',
    },
  })
  console.log(`demo design rebuilt: ${data.items.length} items, net EUR ${net.toFixed(2)}`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
