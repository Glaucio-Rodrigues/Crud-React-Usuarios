import React, { useState, useEffect } from 'react';
import { Database, Search, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Loader2, Table } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('read');
  const tableName = 'Usuarios';
  
  // Estados para controlar os campos do formulário
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  
  // Estados específicos para as ações de Atualizar/Deletar
  const [id, setId] = useState('');

  // Estados de controle da interface (resultado, erro, carregamento e lista de usuários)
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Efeito colateral: busca a lista de usuários sempre que a aba "Consultar" torna-se ativa
  useEffect(() => {
    if (activeTab === 'read') {
      fetchUsers();
    }
  }, [activeTab]);

  // Função centralizada para lidar com requisições HTTP para a nossa API
  const handleRequest = async (fn: () => Promise<Response>, isFetchAll = false) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn();
      const text = await res.text();
      let data = text;
      try { data = JSON.parse(text); } catch {}
      
      if (!res.ok) {
        throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      }
      
      if (isFetchAll && Array.isArray(data)) {
        setUsers(data);
      } else {
        setResult(data);
        if (['create', 'update', 'delete'].includes(activeTab)) {
          clearForm();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para resetar os valores de todos os campos do formulário
  const clearForm = () => {
    setNome('');
    setIdade('');
    setEmail('');
    setCep('');
    setEndereco('');
    setId('');
  };

  // Busca todos os usuários cadastrados
  const fetchUsers = () => {
    handleRequest(async () => fetch(`/api/read/${tableName}`), true);
  };

  // Função auxiliar para garantir que a idade contém apenas números e no máximo 3 dígitos
  const handleIdadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setIdade(value);
  };

  // Função que lida com o input do CEP do usuário, ignorando letras e formatando como XXXXX-XXX
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    setCep(value);
  };

  // Função para formatar o CEP antes da renderização em tela na tabela
  const formatCep = (cepValue: any) => {
    if (!cepValue) return '-';
    let val = String(cepValue).replace(/\D/g, '');
    // Caso seja menor que 8, pode preencher ou apenas exibir como está, mas vamos formatar se tiver pelo menos 6 chars
    if (val.length > 5) {
      return val.replace(/^(\d{5})(\d+)/, '$1-$2');
    }
    return val;
  };

  // Monta dinamicamente arrays de colunas e valores preenchidos a partir dos estados do React
  const getPopulatedColumns = () => {
    const cols = [];
    const vals = [];
    if (nome) { cols.push('Nome'); vals.push(nome); }
    if (idade) { cols.push('Idade'); vals.push(idade); }
    if (email) { cols.push('Email'); vals.push(email); }
    if (cep) { cols.push('Cep'); vals.push(cep.replace(/\D/g, '')); }
    if (endereco) { cols.push('Endereco'); vals.push(endereco); }
    return { cols, vals };
  };

  // Lida com a criação/inserção de um novo usuário
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const { cols, vals } = getPopulatedColumns();
    if (cols.length === 0) return setError("Preencha algum campo para inserir.");
    
    handleRequest(async () => {
      return fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, columns: cols, values: vals })
      });
    });
  };

  // Lida com a atualização de um usuário pelo ID ou Nome
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return setError("O ID ou Nome é obrigatório para atualizar.");
    const { cols, vals } = getPopulatedColumns();
    
    if (cols.length === 0) return setError("Preencha ao menos um campo para atualizar.");

    handleRequest(async () => {
      return fetch(`/api/update/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: cols, values: vals })
      });
    });
  };

  // Lida com exclusão de um usuário pelo ID ou Nome
  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return setError("O ID ou Nome é obrigatório para deletar.");
    handleRequest(async () => {
      return fetch(`/api/delete/${tableName}/${id}`, {
        method: 'DELETE'
      });
    });
  };

  // Abas de navegação da interface (Ações Disponíveis)
  const tabs = [
    { id: 'read', label: 'Consultar', icon: Search, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'create', label: 'Novo Cadastro', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'update', label: 'Atualizar', icon: Edit2, color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 'delete', label: 'Deletar', icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                <Database size={24} />
              </div>
              Sistema de Usuários
            </h1>
            <p className="text-neutral-500 mt-2 text-lg">
              Gerencie usuários facilmente com nossa API.
            </p>
          </div>
        </header>

        {/* Renderiza abas dinamicamente */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  clearForm();
                  setError(null);
                  setResult(null);
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all snap-start whitespace-nowrap ${
                  active 
                    ? `bg-white shadow-sm border border-neutral-200 text-neutral-900` 
                    : `text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700`
                }`}
              >
                <div className={`p-1.5 rounded-md ${active ? tab.bg : 'bg-transparent'} ${active ? tab.color : 'text-neutral-400'}`}>
                  <Icon size={18} />
                </div>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Área Principal de Conteúdo Dinâmico */}
        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-neutral-200">
          
          {/* Aba Ativa: Leitura (Tabela) */}
          {activeTab === 'read' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><Search className="text-green-600"/> Lista de Cadastros</h2>
                <button onClick={fetchUsers} disabled={loading} className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-600">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </div>

              {users.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-100 text-neutral-600 font-medium">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Idade</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">CEP</th>
                        <th className="px-4 py-3">Endereço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {users.map((user, i) => (
                        <tr key={i} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-neutral-900">{user.Id || user.id}</td>
                          <td className="px-4 py-3">{user.Nome || user.nome || '-'}</td>
                          <td className="px-4 py-3">{user.Idade || user.idade || '-'}</td>
                          <td className="px-4 py-3">{user.Email || user.email || '-'}</td>
                          <td className="px-4 py-3">{formatCep(user.Cep || user.cep)}</td>
                          <td className="px-4 py-3 truncate max-w-[200px]" title={user.Endereco || user.endereco}>{user.Endereco || user.endereco || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 bg-neutral-50 rounded-xl border border-neutral-100 border-dashed">
                  Nenhum registro encontrado. Crie um "Novo Cadastro" para começar.
                </div>
              )}
            </div>
          )}

          {/* Formulário Principal para Criação, Atualização e Retirada */}
          {activeTab !== 'read' && (
            <form onSubmit={
              activeTab === 'create' ? handleCreate :
              activeTab === 'update' ? handleUpdate :
              handleDelete
            } className="space-y-6">
              
              <h2 className="text-xl font-bold flex items-center gap-2">
                {activeTab === 'create' && <><Plus className="text-blue-600"/> Cadastrar</>}
                {activeTab === 'update' && <><Edit2 className="text-orange-600"/> Atualizar</>}
                {activeTab === 'delete' && <><Trash2 className="text-red-600"/> Deletar Registro</>}
              </h2>

              {(activeTab === 'update' || activeTab === 'delete') && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl mb-6">
                   <label className="text-sm font-semibold text-neutral-800 block mb-1">ID ou Nome do Usuário (Obrigatório)</label>
                   <input 
                     type="text" 
                     value={id} 
                     onChange={e => setId(e.target.value)} 
                     placeholder="Ex: 5 ou Maria" 
                     required className="w-full md:w-1/3 bg-white border border-neutral-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                   />
                </div>
              )}

              {activeTab !== 'delete' && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 block">Nome</label>
                    <input type="text" maxLength={50} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Maria" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 block">Idade</label>
                    <input type="text" maxLength={3} value={idade} onChange={handleIdadeChange} placeholder="Ex: 30" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 block">Email</label>
                    <input type="email" maxLength={70} value={email} onChange={e => setEmail(e.target.value)} placeholder="Ex: maria@email.com" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 block">CEP</label>
                    <input type="text" value={cep} onChange={handleCepChange} placeholder="Ex: 12345-678" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-neutral-700 block">Endereço Completo</label>
                    <input type="text" maxLength={100} value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Ex: Rua das Flores, 123, Apto 5" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              )}

              {activeTab === 'delete' && (
                <p className="text-sm text-red-700 bg-red-50 p-4 rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertCircle size={18} /> Você está prestes a apagar um registro permanentemente.
                </p>
              )}

              <div className="pt-4 border-t border-neutral-100">
                {activeTab === 'create' && (
                  <button disabled={loading} type="submit" className="flex justify-center items-center gap-2 w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>} Criar
                  </button>
                )}
                {activeTab === 'update' && (
                  <button disabled={loading} type="submit" className="flex justify-center items-center gap-2 w-full md:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Edit2 size={18}/>} Salvar Modificações
                  </button>
                )}
                {activeTab === 'delete' && (
                  <button disabled={loading} type="submit" className="flex justify-center items-center gap-2 w-full md:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>} Confirmar Exclusão
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Área Dinâmica de Resultados JSON ou Erros da API */}
          {(error || result !== null) && (
            <div className="mt-8 pt-8 border-t border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3 uppercase tracking-wider">Resposta:</h3>
              {error ? (
                <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-semibold mb-1">Ocorreu um erro</h4>
                    <p className="font-mono text-sm break-all">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0f172a] p-5 rounded-xl shadow-inner relative border border-slate-800">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs font-medium border border-emerald-400/20">
                    <CheckCircle2 size={14} /> Operação Realizada
                  </div>
                  <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap overflow-x-auto pr-24 max-h-[400px] overflow-y-auto mt-2">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
