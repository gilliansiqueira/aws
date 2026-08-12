export type ClienteOption = {
  id: string;
  nome: string;
  cnpj: string | null;
  cidade: string | null;
  uf: string | null;
  compradorPadrao: string | null;
  formaPagamentoPadraoId: string | null;
};

export type IndustriaOption = {
  id: string;
  nome: string;
  whatsapp: string;
  transportadoraPadraoId: string | null;
};

export type TransportadoraOption = {
  id: string;
  nome: string;
};

export type FormaPagamentoOption = {
  id: string;
  nome: string;
  numeroParcelas: number;
  primeiraParcelaDias: number;
  intervaloDias: number;
};

export type ProdutoOption = {
  id: string;
  nome: string;
  codigo: string;
  referencia: string | null;
  industriaId: string;
  marcaNome: string;
  unidade: string;
  pesoLiquido: number;
  preco: number;
};

export type ItemWizard = {
  produtoId: string;
  codigo: string;
  referencia: string | null;
  descricao: string;
  marcaNome: string;
  unidade: string;
  pesoLiquidoUnit: number;
  valorUnitario: number;
  quantidade: number;
};

export type WizardCatalogs = {
  clientes: ClienteOption[];
  industrias: IndustriaOption[];
  transportadoras: TransportadoraOption[];
  formasPagamento: FormaPagamentoOption[];
  produtos: ProdutoOption[];
};

export type EmpresaSnapshot = {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
};

export type WizardInitialData = {
  clienteId: string;
  industriaId: string;
  transportadoraId: string;
  compradorNome: string;
  formaPagamentoId: string;
  observacoes: string;
  itens: ItemWizard[];
};
