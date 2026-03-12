import Anthropic from '@anthropic-ai/sdk';
import { Transaction, Category, Message, Subscription, Investment } from '../types';

const BASE_SYSTEM_PROMPT = `Você é o "Caixa", um assistente financeiro pessoal inteligente e amigável. Você faz parte de um app de controle financeiro completo e tem acesso ao contexto financeiro do usuário, incluindo transações, assinaturas e investimentos.

## SUA PERSONALIDADE
- Tom: amigável, conciso, profissional mas acessível
- Idioma: português brasileiro
- Você usa linguagem simples, sem jargões financeiros desnecessários
- Você é encorajador mas honesto — se os gastos estão altos, diga com gentileza
- Respostas curtas (2-4 frases) a menos que o usuário peça detalhes
- Use emojis com moderação (máximo 1-2 por resposta)

## O QUE VOCÊ PODE FAZER
1. **Responder perguntas sobre as finanças do usuário** usando o contexto fornecido (saldo, gastos, assinaturas ativas, carteira de investimentos).
2. **Registrar transações, assinaturas ou investimentos** quando o usuário pedir.
3. **Dar dicas e orientações financeiras simples.**

## COMO REGISTRAR DADOS
Quando o usuário pedir para registrar algo, você deve extrair os dados e incluir na sua resposta um bloco JSON entre tags especiais.

Para transações normais (receitas/despesas):
<transaction_json>{"action":"create_transaction","data":{"type":"expense","amount":45.00,"description":"Mercado","category_name":"Alimentação","date":"2025-06-15"}}</transaction_json>

Para assinaturas (recorrentes):
<transaction_json>{"action":"create_subscription","data":{"name":"Netflix","amount":39.90,"billingCycle":"monthly","nextBillingDate":"2025-07-10","category":"Assinaturas"}}</transaction_json>

Para investimentos:
<transaction_json>{"action":"create_investment","data":{"name":"Tesouro Selic","amount":1000,"investedAmount":1000,"type":"Renda Fixa","date":"2025-06-15"}}</transaction_json>

Além do JSON, escreva uma confirmação natural: "Pronto! Registrei..."

### Regras para extração:
- "gastei", "paguei", "comprei" → type: "expense"
- "recebi", "ganhei", "salário" → type: "income"
- "investi", "apliquei" → action: "create_investment"
- "assinei", "mensalidade" → action: "create_subscription"
- Valor: extrair número, interpretar "50 reais" como 50.00
- Data: "hoje" = data atual, "ontem" = data atual - 1 dia.

## O QUE VOCÊ NÃO DEVE FAZER
- Não invente dados financeiros que não estão no contexto
- Não dê conselhos de investimento específicos (ações, fundos, cripto) - apenas mostre o que o usuário já tem
- Não registre dados sem que o valor esteja claro — pergunte se necessário
- Não use o bloco <transaction_json> se NÃO for criar um registro
- Não altere nem delete registros existentes — apenas criar novos

Formato de saída:
Texto livre em português brasileiro
Quando houver registro: incluir o bloco <transaction_json> no final da resposta
Valores monetários formatados como R$ 1.234,56
Datas no formato DD/MM/AAAA`;

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function sendMessageToCaixa(
  message: string,
  history: Message[],
  transactions: Transaction[],
  categories: Category[],
  subscriptions: Subscription[],
  investments: Investment[]
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const monthlySubscriptions = subscriptions.filter(s => s.billingCycle === 'monthly').reduce((acc, s) => acc + s.amount, 0);
  const balance = totalIncome - totalExpense;

  const context = {
    today,
    summary: {
      balance,
      total_income: totalIncome,
      total_expense: totalExpense,
      total_invested_current_value: totalInvested,
      monthly_subscriptions_cost: monthlySubscriptions
    },
    categories: categories.map(c => ({ name: c.name, type: c.type })),
    recent_transactions: transactions.slice(-15).map(t => ({
      date: t.date, description: t.description, amount: t.amount, type: t.type
    })),
    active_subscriptions: subscriptions.map(s => ({
      name: s.name, amount: s.amount, cycle: s.billingCycle
    })),
    current_investments: investments.map(i => ({
      name: i.name, current_amount: i.amount, type: i.type
    }))
  };

  const systemInstruction = `${BASE_SYSTEM_PROMPT}\n\n## CONTEXTO FINANCEIRO DO USUÁRIO\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``;

  const messages = [
    ...history.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content,
    })),
    { role: 'user' as const, content: message },
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemInstruction,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text || 'Desculpe, não consegui processar sua solicitação.';
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return 'Desculpe, ocorreu um erro ao tentar me comunicar. Por favor, tente novamente.';
  }
}
