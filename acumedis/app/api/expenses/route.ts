import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const url = new URL(req.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const where: any = { tenantId: tenantId! }
  if (start || end) {
    where.date = {}
    if (start) where.date.gte = new Date(start)
    if (end) where.date.lte = new Date(`${end}T23:59:59.999`)
  }
  const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } })
  return NextResponse.json(expenses.map(e => ({ id: e.id, expense_date: e.date.toISOString().slice(0, 10), amount: e.amount, category: e.category, description: e.description })))
}

export async function POST(req: NextRequest) {
  const { error, tenantId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const expense = await prisma.expense.create({
    data: {
      tenantId: tenantId!,
      description: body.description,
      amount: Number(body.amount),
      category: body.category,
      date: body.expense_date ? new Date(`${body.expense_date}T12:00:00.000Z`) : new Date(),
    },
  })
  return NextResponse.json({ id: expense.id, expense_date: expense.date.toISOString().slice(0, 10), amount: expense.amount, category: expense.category, description: expense.description }, { status: 201 })
}
