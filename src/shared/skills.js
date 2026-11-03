// Taxonomia própria de skills: cada skill tem sinônimos (como aparece em vagas, PT e EN) e "pais",
// skills mais amplas que ela implica. Ex.: PostgreSQL -> SQL -> Banco de dados.
//
//  - Quem tem uma skill também tem todos os seus ancestrais (PostgreSQL atende "SQL" e "banco de dados").
//  - Skills "irmãs" sob um pai específico são parecidas (MySQL ~ PostgreSQL, Power BI ~ Tableau).
//  - Pais marcados como amplos (ex.: "Linguagem de programação") não tornam os filhos parecidos:
//    saber Python não significa saber Java.
//
// Para incluir uma skill: S("Nome", ["sinônimo", ...], ["Pai 1", "Pai 2"]). Pais precisam existir aqui.

const S = (nome, sinonimos = [], pais = []) => ({ nome, formas: [nome, ...sinonimos], pais, amplo: false });
// Só os sinônimos casam (o nome sozinho daria falso positivo, ex.: "Benefícios" em toda vaga).
const SO = (nome, sinonimos = [], pais = []) => ({ ...S(nome, sinonimos, pais), formas: sinonimos });
// Agrupador intermediário (ex.: "Ferramenta de BI"): conta para a compatibilidade, mas não vira competência no currículo.
const CAT = (nome, sinonimos = [], pais = []) => ({ ...S(nome, sinonimos, pais), categoria: true });
const AMPLO = (nome, sinonimos = [], pais = []) => ({ ...S(nome, sinonimos, pais), amplo: true });

export const SKILLS = [
  // ---------- Categorias amplas ----------
  AMPLO("Programação", ["programacao", "programming", "desenvolvimento de software", "software development", "codificacao"]),
  AMPLO("Linguagem de programação", ["linguagens de programacao", "programming language", "programming languages"], ["Programação"]),
  AMPLO("Desenvolvimento web", ["web development", "aplicacoes web", "web applications"], ["Programação"]),
  AMPLO("Frontend", ["front-end", "front end", "frontend development"], ["Desenvolvimento web"]),
  AMPLO("Backend", ["back-end", "back end", "server-side"], ["Programação"]),
  AMPLO("Desenvolvimento mobile", ["mobile", "aplicativos moveis", "mobile development", "apps mobile"], ["Programação"]),
  AMPLO("Banco de dados", ["bancos de dados", "database", "databases", "bd", "base de dados", "bases de dados", "sgbd"]),
  AMPLO("Infraestrutura", ["infra", "infrastructure", "infraestrutura de ti"]),
  AMPLO("Análise de dados", ["analise de dados", "data analysis", "analytics", "analisar dados", "data analytics"]),
  AMPLO("Ciência de dados", ["ciencia de dados", "data science", "cientista de dados"], ["Análise de dados"]),
  AMPLO("Design", ["design de produto", "product design"]),
  AMPLO("Marketing digital", ["digital marketing", "marketing online"]),
  AMPLO("Finanças", ["financas", "finance", "financeiro", "area financeira"]),
  AMPLO("Gestão de pessoas", ["gestao de pessoas", "people management", "recursos humanos", "rh", "human resources"]),
  AMPLO("Logística", ["logistica", "logistics", "supply chain", "cadeia de suprimentos"]),
  AMPLO("Rotinas administrativas", ["rotinas administrativas", "administrativo", "administrative", "backoffice"]),
  AMPLO("Vendas", ["vendas", "sales", "comercial"]),
  AMPLO("Jurídico", ["juridico", "direito"]),

  // ---------- Linguagens ----------
  S("JavaScript", ["javascript", "js", "ecmascript", "es6"], ["Linguagem de programação", "Frontend"]),
  S("TypeScript", ["typescript", "ts"], ["JavaScript", "Linguagem de programação"]),
  S("Python", ["python", "python3"], ["Linguagem de programação"]),
  S("Java", ["java", "jvm"], ["Linguagem de programação"]),
  S("Kotlin", ["kotlin"], ["Linguagem de programação", "Java"]),
  S("C#", ["c#", "csharp"], ["Linguagem de programação"]),
  S("PHP", ["php"], ["Linguagem de programação", "Backend"]),
  S("Go", ["golang"], ["Linguagem de programação", "Backend"]),
  S("Ruby", ["ruby"], ["Linguagem de programação"]),
  S("Swift", ["swift"], ["Linguagem de programação", "iOS"]),
  S("Dart", ["dart"], ["Linguagem de programação"]),
  S("C++", ["c++", "cpp"], ["Linguagem de programação"]),
  S("Rust", ["rust"], ["Linguagem de programação"]),
  S("Scala", ["scala"], ["Linguagem de programação"]),
  S("Linguagem R", ["linguagem r", "rstudio", "r language", "tidyverse"], ["Linguagem de programação", "Estatística"]),
  S("VBA", ["vba", "macros", "macro excel"], ["Excel", "Linguagem de programação"]),
  S("Shell script", ["shell script", "bash", "shell scripting", "powershell"], ["Linux"]),

  // ---------- Frontend ----------
  S("HTML", ["html", "html5"], ["Frontend"]),
  S("CSS", ["css", "css3"], ["Frontend"]),
  S("Sass", ["sass", "scss"], ["CSS"]),
  S("Tailwind CSS", ["tailwind", "tailwindcss"], ["CSS"]),
  S("Bootstrap", ["bootstrap"], ["CSS"]),
  CAT("Framework frontend", ["frameworks frontend", "frontend framework", "frameworks front-end"], ["Frontend", "JavaScript"]),
  S("React", ["react", "react.js", "reactjs"], ["Framework frontend"]),
  S("Vue.js", ["vue", "vue.js", "vuejs"], ["Framework frontend"]),
  S("Angular", ["angular", "angularjs"], ["Framework frontend", "TypeScript"]),
  S("Svelte", ["svelte"], ["Framework frontend"]),
  S("Next.js", ["next.js", "nextjs"], ["React"]),
  S("Nuxt", ["nuxt", "nuxt.js"], ["Vue.js"]),
  S("Redux", ["redux"], ["React"]),
  S("jQuery", ["jquery"], ["JavaScript"]),
  S("Acessibilidade web", ["acessibilidade", "accessibility", "wcag", "a11y"], ["Frontend"]),

  // ---------- Backend ----------
  S("Node.js", ["node.js", "nodejs", "node"], ["JavaScript", "Backend"]),
  S("Express", ["express.js", "expressjs"], ["Node.js"]),
  S("NestJS", ["nestjs", "nest.js"], ["Node.js", "TypeScript"]),
  CAT("Framework Python", ["frameworks python"], ["Python", "Backend"]),
  S("Django", ["django"], ["Framework Python"]),
  S("Flask", ["flask"], ["Framework Python"]),
  S("FastAPI", ["fastapi"], ["Framework Python"]),
  S("Spring", ["spring boot", "spring framework", "springboot"], ["Java", "Backend"]),
  S(".NET", [".net", "dotnet", "asp.net", ".net core"], ["C#", "Backend"]),
  S("Laravel", ["laravel"], ["PHP"]),
  S("Ruby on Rails", ["rails", "ruby on rails"], ["Ruby", "Backend"]),
  S("APIs", ["api", "apis", "integracoes", "integracao de sistemas", "integrations", "web services", "webservices"], ["Backend"]),
  S("APIs REST", ["api rest", "apis rest", "rest api", "rest apis", "restful"], ["APIs"]),
  S("GraphQL", ["graphql"], ["APIs"]),
  S("Microsserviços", ["microsservicos", "microservices", "micro servicos"], ["Backend", "Arquitetura de software"]),
  S("Arquitetura de software", ["arquitetura de software", "software architecture", "design patterns", "padroes de projeto", "solid", "clean architecture"], ["Programação"]),
  CAT("Mensageria", ["mensageria", "message broker", "queues"], ["Backend"]),
  S("Kafka", ["kafka"], ["Mensageria"]),
  S("RabbitMQ", ["rabbitmq"], ["Mensageria"]),

  // ---------- Mobile ----------
  S("Android", ["android"], ["Desenvolvimento mobile"]),
  S("iOS", ["ios"], ["Desenvolvimento mobile"]),
  CAT("Mobile multiplataforma", ["multiplataforma", "cross-platform", "hibrido mobile"], ["Desenvolvimento mobile"]),
  S("React Native", ["react native"], ["Mobile multiplataforma", "React"]),
  S("Flutter", ["flutter"], ["Mobile multiplataforma", "Dart"]),

  // ---------- Banco de dados ----------
  S("SQL", ["sql", "t-sql", "pl/sql", "consultas sql", "queries sql", "linguagem sql"], ["Banco de dados"]),
  CAT("Banco de dados relacional", ["banco de dados relacional", "bancos de dados relacionais", "relational database", "relational databases", "rdbms", "modelagem relacional"], ["Banco de dados", "SQL"]),
  S("PostgreSQL", ["postgresql", "postgres", "psql", "postgree", "postgre"], ["Banco de dados relacional"]),
  S("MySQL", ["mysql", "mariadb"], ["Banco de dados relacional"]),
  S("SQL Server", ["sql server", "mssql", "microsoft sql server"], ["Banco de dados relacional"]),
  S("Oracle Database", ["oracle", "oracle database", "oracle db"], ["Banco de dados relacional"]),
  S("SQLite", ["sqlite"], ["Banco de dados relacional"]),
  S("NoSQL", ["nosql", "banco nao relacional", "bancos nao relacionais", "non-relational"], ["Banco de dados"]),
  S("MongoDB", ["mongodb", "mongo"], ["NoSQL"]),
  S("Redis", ["redis"], ["NoSQL"]),
  S("DynamoDB", ["dynamodb"], ["NoSQL", "AWS"]),
  S("Firebase", ["firebase", "firestore"], ["NoSQL"]),
  S("Elasticsearch", ["elasticsearch", "elastic search", "opensearch"], ["NoSQL"]),
  S("Modelagem de dados", ["modelagem de dados", "data modeling", "modelagem dimensional"], ["Banco de dados"]),
  S("Procedures", ["procedures", "stored procedures", "triggers", "functions sql"], ["SQL"]),

  // ---------- Cloud, DevOps, Infra ----------
  CAT("Cloud", ["cloud", "nuvem", "cloud computing", "computacao em nuvem"], ["Infraestrutura"]),
  S("AWS", ["aws", "amazon web services", "ec2", "s3", "lambda"], ["Cloud"]),
  S("Azure", ["azure", "microsoft azure"], ["Cloud"]),
  S("Google Cloud", ["gcp", "google cloud", "google cloud platform", "bigquery"], ["Cloud"]),
  CAT("DevOps", ["devops", "sre", "site reliability"], ["Infraestrutura"]),
  CAT("Containers", ["containers", "conteineres", "containerizacao", "containerization"], ["DevOps"]),
  S("Docker", ["docker", "docker compose", "dockerfile"], ["Containers"]),
  S("Kubernetes", ["kubernetes", "k8s", "eks", "aks", "gke", "openshift"], ["Containers"]),
  S("CI/CD", ["ci/cd", "integracao continua", "entrega continua", "continuous integration", "continuous delivery", "pipelines de deploy", "esteira de deploy"], ["DevOps"]),
  S("GitHub Actions", ["github actions"], ["CI/CD"]),
  S("Jenkins", ["jenkins"], ["CI/CD"]),
  S("GitLab CI", ["gitlab ci", "gitlab-ci"], ["CI/CD"]),
  S("Azure DevOps", ["azure devops"], ["CI/CD", "Azure"]),
  CAT("Infraestrutura como código", ["infraestrutura como codigo", "infrastructure as code", "iac"], ["DevOps"]),
  S("Terraform", ["terraform"], ["Infraestrutura como código"]),
  S("Ansible", ["ansible"], ["Infraestrutura como código"]),
  S("Linux", ["linux", "unix", "ubuntu", "debian", "red hat", "centos"], ["Infraestrutura"]),
  S("Redes de computadores", ["networking", "tcp/ip", "dns", "firewall", "vpn"], ["Infraestrutura"]),
  SO("Monitoramento", ["observabilidade", "observability", "monitoring", "grafana", "prometheus", "datadog", "new relic"], ["DevOps"]),
  S("Segurança da informação", ["seguranca da informacao", "information security", "cybersecurity", "ciberseguranca", "appsec", "owasp", "iso 27001"], ["Infraestrutura"]),
  S("Suporte técnico", ["suporte tecnico", "help desk", "helpdesk", "service desk", "suporte a usuarios", "suporte ao usuario", "atendimento de chamados", "technical support"], ["Infraestrutura"]),

  // ---------- Versionamento e qualidade ----------
  CAT("Versionamento", ["versionamento", "controle de versao", "controle de versoes", "version control"], ["Programação"]),
  S("Git", ["git", "github", "gitlab", "bitbucket"], ["Versionamento"]),
  S("Testes automatizados", ["testes automatizados", "automated tests", "automated testing", "testes unitarios", "unit tests", "unit testing", "tdd", "testes de integracao", "testes e2e"], ["Qualidade de software"]),
  CAT("Qualidade de software", ["qa", "quality assurance", "qualidade de software", "testes de software", "software testing"], ["Programação"]),
  S("Jest", ["jest"], ["Testes automatizados", "JavaScript"]),
  S("Cypress", ["cypress"], ["Testes automatizados"]),
  S("Selenium", ["selenium"], ["Testes automatizados"]),
  S("Playwright", ["playwright"], ["Testes automatizados"]),
  S("Pytest", ["pytest"], ["Testes automatizados", "Python"]),
  S("JUnit", ["junit"], ["Testes automatizados", "Java"]),

  // ---------- Dados e BI ----------
  S("Business Intelligence", ["business intelligence", "bi", "inteligencia de negocios"], ["Análise de dados"]),
  CAT("Ferramenta de BI", ["ferramentas de bi", "ferramenta de bi", "bi tools", "dataviz tools"], ["Business Intelligence", "Visualização de dados"]),
  S("Visualização de dados", ["visualizacao de dados", "data visualization", "dataviz", "dashboards", "dashboard", "paineis", "relatorios gerenciais"], ["Análise de dados"]),
  S("Power BI", ["power bi", "powerbi", "dax", "power query"], ["Ferramenta de BI"]),
  S("Tableau", ["tableau"], ["Ferramenta de BI"]),
  S("Looker", ["looker", "looker studio", "data studio", "google data studio"], ["Ferramenta de BI"]),
  S("Qlik", ["qlik", "qlikview", "qlik sense"], ["Ferramenta de BI"]),
  S("Metabase", ["metabase"], ["Ferramenta de BI"]),
  S("Engenharia de dados", ["engenharia de dados", "data engineering", "engenheiro de dados", "data engineer"], ["Análise de dados", "Programação"]),
  S("ETL", ["etl", "elt", "pipelines de dados", "data pipelines", "data pipeline", "cargas de dados", "integracao de dados", "ingestao de dados"], ["Engenharia de dados"]),
  S("Data Warehouse", ["data warehouse", "dw", "data lake", "datalake", "lakehouse"], ["Engenharia de dados", "Banco de dados"]),
  S("Big Data", ["big data", "hadoop"], ["Engenharia de dados"]),
  S("Spark", ["spark", "pyspark", "databricks"], ["Big Data"]),
  S("Airflow", ["airflow"], ["ETL"]),
  S("dbt", ["dbt"], ["ETL", "SQL"]),
  S("Snowflake", ["snowflake"], ["Data Warehouse"]),
  S("Pandas", ["pandas", "numpy"], ["Python", "Análise de dados"]),
  S("Estatística", ["estatistica", "statistics", "estatistico", "testes de hipotese", "regressao"], ["Análise de dados"]),
  S("Machine Learning", ["machine learning", "aprendizado de maquina", "modelos preditivos", "predictive models"], ["Ciência de dados"]),
  S("Deep Learning", ["deep learning", "redes neurais", "neural networks"], ["Machine Learning"]),
  S("Scikit-learn", ["scikit-learn", "sklearn"], ["Machine Learning", "Python"]),
  S("TensorFlow", ["tensorflow", "keras"], ["Deep Learning"]),
  S("PyTorch", ["pytorch"], ["Deep Learning"]),
  S("Inteligência artificial", ["inteligencia artificial", "artificial intelligence", "ia generativa", "genai", "generative ai", "llm", "llms", "agentes de ia"], ["Ciência de dados"]),
  CAT("Planilhas", ["planilhas", "spreadsheets", "planilha"], ["Análise de dados", "Pacote Office"]),
  S("Excel", ["excel", "excel avancado", "microsoft excel", "procv", "vlookup", "tabela dinamica", "tabelas dinamicas", "pivot table"], ["Planilhas"]),
  S("Google Sheets", ["google sheets", "planilhas google"], ["Planilhas"]),

  // ---------- Escritório ----------
  S("Pacote Office", ["pacote office", "microsoft office", "office 365", "ms office"], ["Rotinas administrativas"]),
  S("Word", ["microsoft word"], ["Pacote Office"]),
  S("PowerPoint", ["powerpoint"], ["Pacote Office"]),
  S("Google Workspace", ["google workspace", "g suite", "gsuite"], ["Pacote Office"]),

  // ---------- Design ----------
  S("UX", ["ux", "user experience", "experiencia do usuario", "ux design"], ["Design"]),
  S("UI", ["ui", "user interface", "ui design", "interface do usuario"], ["Design"]),
  S("Pesquisa com usuários", ["pesquisa com usuarios", "user research", "ux research", "testes de usabilidade", "usability testing", "entrevistas com usuarios"], ["UX"]),
  S("Prototipação", ["prototipacao", "prototipos", "prototyping", "wireframes", "wireframe"], ["UX", "UI"]),
  CAT("Ferramenta de prototipação", ["ferramentas de prototipacao", "design tools"], ["Prototipação"]),
  S("Figma", ["figma"], ["Ferramenta de prototipação"]),
  S("Adobe XD", ["adobe xd"], ["Ferramenta de prototipação"]),
  S("Sketch", ["sketch"], ["Ferramenta de prototipação"]),
  S("Design System", ["design system", "design systems"], ["UI"]),
  S("Design gráfico", ["design grafico", "graphic design", "identidade visual", "branding"], ["Design"]),
  CAT("Ferramentas Adobe", ["adobe", "pacote adobe", "adobe creative cloud", "creative suite"], ["Design gráfico"]),
  S("Photoshop", ["photoshop"], ["Ferramentas Adobe"]),
  S("Illustrator", ["illustrator"], ["Ferramentas Adobe"]),
  S("InDesign", ["indesign"], ["Ferramentas Adobe"]),
  S("Canva", ["canva"], ["Design gráfico"]),
  S("Edição de vídeo", ["edicao de video", "video editing", "edicao de videos", "motion design", "motion graphics"], ["Design"]),
  S("Premiere", ["premiere", "adobe premiere"], ["Edição de vídeo", "Ferramentas Adobe"]),
  S("After Effects", ["after effects"], ["Edição de vídeo", "Ferramentas Adobe"]),

  // ---------- Produto e projetos ----------
  S("Metodologias ágeis", ["metodologias ageis", "metodologia agil", "agile", "agil", "ageis"], ["Gestão de projetos"]),
  S("Scrum", ["scrum", "sprints", "sprint", "daily", "scrum master"], ["Metodologias ágeis"]),
  S("Kanban", ["kanban"], ["Metodologias ágeis"]),
  S("Gestão de projetos", ["gestao de projetos", "gerenciamento de projetos", "project management", "pmo", "pmbok", "pmp"]),
  CAT("Ferramenta de gestão de tarefas", ["gestao de tarefas", "task management"], ["Gestão de projetos"]),
  S("Jira", ["jira", "confluence"], ["Ferramenta de gestão de tarefas"]),
  S("Trello", ["trello"], ["Ferramenta de gestão de tarefas"]),
  S("Asana", ["asana"], ["Ferramenta de gestão de tarefas"]),
  S("Gestão de produto", ["gestao de produto", "product management", "product owner", "product manager", "roadmap", "discovery", "backlog"], ["Gestão de projetos"]),
  S("OKR", ["okr", "okrs"], ["Indicadores"]),
  S("Indicadores", ["indicadores", "kpi", "kpis", "metricas", "metrics"], ["Análise de dados"]),
  S("Melhoria contínua", ["melhoria continua", "lean", "six sigma", "kaizen", "pdca", "5s"], ["Gestão de projetos"]),
  S("Mapeamento de processos", ["mapeamento de processos", "bpm", "bpmn", "process mapping", "gestao de processos"], ["Melhoria contínua"]),

  // ---------- Marketing ----------
  S("SEO", ["seo", "otimizacao para buscadores"], ["Marketing digital"]),
  S("Mídia paga", ["midia paga", "paid media", "trafego pago", "ppc", "anuncios pagos"], ["Marketing digital"]),
  S("Google Ads", ["google ads", "adwords"], ["Mídia paga"]),
  S("Meta Ads", ["meta ads", "facebook ads", "instagram ads"], ["Mídia paga"]),
  S("LinkedIn Ads", ["linkedin ads"], ["Mídia paga"]),
  S("Web analytics", ["web analytics", "google analytics", "ga4", "tag manager", "gtm"], ["Marketing digital", "Análise de dados"]),
  S("Redes sociais", ["redes sociais", "social media", "midias sociais", "instagram", "tiktok", "gestao de redes sociais"], ["Marketing digital"]),
  S("Marketing de conteúdo", ["marketing de conteudo", "content marketing", "producao de conteudo", "blog"], ["Marketing digital"]),
  S("Copywriting", ["copywriting", "redacao publicitaria"], ["Marketing de conteúdo"]),
  S("E-mail marketing", ["email marketing", "e-mail marketing", "automacao de marketing", "marketing automation"], ["Marketing digital"]),
  S("Inbound marketing", ["inbound", "inbound marketing", "geracao de leads", "lead generation"], ["Marketing digital"]),
  S("RD Station", ["rd station", "rdstation"], ["E-mail marketing", "CRM"]),
  S("Growth", ["growth", "growth marketing", "growth hacking", "testes a/b", "a/b testing"], ["Marketing digital"]),
  S("E-commerce", ["e-commerce", "ecommerce", "loja virtual", "marketplace", "vtex", "shopify"], ["Vendas"]),

  // ---------- Vendas e clientes ----------
  S("CRM", ["crm", "gestao de relacionamento com o cliente"], ["Vendas"]),
  S("Salesforce", ["salesforce"], ["CRM"]),
  S("HubSpot", ["hubspot"], ["CRM", "Inbound marketing"]),
  S("Pipedrive", ["pipedrive"], ["CRM"]),
  S("Prospecção", ["prospeccao", "prospecting", "outbound", "cold call", "sdr", "bdr"], ["Vendas"]),
  S("Negociação", ["negociacao", "negotiation", "negociar"], ["Vendas"]),
  S("Vendas B2B", ["vendas b2b", "b2b", "vendas consultivas", "venda consultiva", "consultative selling"], ["Vendas"]),
  S("Vendas B2C", ["vendas b2c", "b2c", "varejo", "retail"], ["Vendas"]),
  S("Funil de vendas", ["funil de vendas", "pipeline de vendas", "sales funnel", "forecast"], ["Vendas"]),
  S("Atendimento ao cliente", ["atendimento ao cliente", "atendimento", "customer service", "customer support", "sac", "relacionamento com clientes", "pos-venda", "pos venda"]),
  S("Customer Success", ["customer success", "sucesso do cliente", "churn", "onboarding de clientes"], ["Atendimento ao cliente"]),

  // ---------- Finanças e contabilidade ----------
  S("Contabilidade", ["contabilidade", "accounting", "contabil", "lancamentos contabeis", "escrituracao"], ["Finanças"]),
  S("Fiscal", ["fiscal", "tributario", "tributos", "impostos", "icms", "sped", "apuracao de impostos"], ["Contabilidade"]),
  S("Demonstrações financeiras", ["demonstracoes financeiras", "dre", "balanco patrimonial", "balanco", "financial statements", "ifrs", "cpc"], ["Contabilidade"]),
  S("Conciliação", ["conciliacao bancaria", "conciliacao", "conciliacoes", "reconciliation"], ["Finanças"]),
  S("Contas a pagar e receber", ["contas a pagar", "contas a receber", "accounts payable", "accounts receivable", "faturamento", "cobranca"], ["Finanças"]),
  S("Fluxo de caixa", ["fluxo de caixa", "cash flow", "tesouraria", "treasury"], ["Finanças"]),
  S("Orçamento", ["orcamento", "budget", "fp&a", "planejamento financeiro", "forecast financeiro"], ["Finanças"]),
  S("Controladoria", ["controladoria", "controller", "analise de custos", "custeio", "gestao de custos"], ["Finanças"]),
  S("Análise financeira", ["analise financeira", "financial analysis", "valuation", "modelagem financeira", "financial modeling"], ["Finanças", "Análise de dados"]),
  S("Auditoria", ["auditoria", "audit", "auditing", "controles internos", "sox"], ["Contabilidade"]),
  S("ERP", ["erp", "sistema erp", "sistemas erp"], ["Rotinas administrativas"]),
  S("SAP", ["sap", "sap fi", "sap mm", "sap sd", "s/4hana"], ["ERP"]),
  S("TOTVS", ["totvs", "protheus", "rm totvs", "datasul"], ["ERP"]),
  S("Oracle ERP", ["oracle erp", "oracle netsuite", "netsuite"], ["ERP"]),

  // ---------- RH ----------
  S("Recrutamento e seleção", ["recrutamento e selecao", "recrutamento", "selecao", "recruitment", "talent acquisition", "r&s", "hunting", "triagem de curriculos"], ["Gestão de pessoas"]),
  S("Departamento pessoal", ["departamento pessoal", "admissao", "rescisao", "rescisoes"], ["Gestão de pessoas"]),
  S("Folha de pagamento", ["folha de pagamento", "payroll"], ["Departamento pessoal"]),
  S("eSocial", ["esocial", "e-social"], ["Departamento pessoal"]),
  S("Legislação trabalhista", ["legislacao trabalhista", "clt", "direito trabalhista", "labor law"], ["Departamento pessoal", "Jurídico"]),
  SO("Benefícios", ["gestao de beneficios", "administracao de beneficios"], ["Gestão de pessoas"]),
  S("Treinamento e desenvolvimento", ["treinamento e desenvolvimento", "t&d", "educacao corporativa", "trilhas de aprendizagem"], ["Gestão de pessoas"]),
  S("Business Partner", ["business partner", "hrbp", "bp de rh"], ["Gestão de pessoas"]),
  S("Clima organizacional", ["clima organizacional", "employee experience", "pesquisa de clima"], ["Gestão de pessoas"]),

  // ---------- Logística e administração ----------
  S("Gestão de estoque", ["gestao de estoque", "controle de estoque", "estoque", "inventario", "inventory"], ["Logística"]),
  S("Compras", ["compras", "procurement", "suprimentos", "purchasing", "cotacoes", "negociacao com fornecedores"], ["Logística"]),
  S("Gestão de transportes", ["gestao de transportes", "frota", "roteirizacao", "expedicao"], ["Logística"]),
  S("WMS", ["wms", "warehouse management"], ["Gestão de estoque"]),
  S("Comércio exterior", ["comercio exterior", "comex", "importacao", "exportacao", "despacho aduaneiro"], ["Logística"]),
  S("Atendimento telefônico", ["atendimento telefonico", "telefonia", "call center", "telemarketing"], ["Atendimento ao cliente"]),
  S("Gestão documental", ["organizacao de documentos", "arquivamento"], ["Rotinas administrativas"]),

  // ---------- Jurídico ----------
  S("Contratos", ["contratos", "elaboracao de contratos", "analise de contratos", "contracts"], ["Jurídico"]),
  S("LGPD", ["lgpd", "gdpr", "protecao de dados", "privacidade de dados"], ["Jurídico", "Compliance"]),
  S("Compliance", ["compliance", "conformidade", "governanca", "gestao de riscos"], ["Jurídico"]),
  S("Contencioso", ["contencioso", "litigation", "processos judiciais", "audiencias"], ["Jurídico"]),

  // ---------- Competências comportamentais ----------
  S("Liderança", ["lideranca", "leadership", "gestao de equipes", "gestao de equipe", "lideranca de equipes", "coordenacao de equipe", "mentoria", "mentorei"]),
  S("Comunicação", ["comunicacao", "communication", "boa comunicacao", "oratoria"]),
  S("Trabalho em equipe", ["trabalho em equipe", "teamwork", "colaboracao", "colaborativo", "collaboration"]),
  S("Resolução de problemas", ["resolucao de problemas", "problem solving", "solucao de problemas"]),
  S("Pensamento analítico", ["pensamento analitico", "analytical thinking", "raciocinio logico", "perfil analitico", "visao analitica"]),
  SO("Organização", ["organizado", "organizada", "gestao do tempo", "time management", "senso de organizacao"]),
  S("Proatividade", ["proatividade", "proativo", "proativa", "proactive", "ownership"]),
];

const porNome = new Map(SKILLS.map((s) => [s.nome, s]));
export const skillPorNome = (nome) => porNome.get(nome);

// Todos os ancestrais (pais, avós…) de uma skill.
const cacheAncestrais = new Map();
export function ancestrais(nome) {
  if (!cacheAncestrais.has(nome)) {
    const acc = new Set();
    const subir = (n) => {
      for (const p of porNome.get(n)?.pais || []) if (!acc.has(p)) { acc.add(p); subir(p); }
    };
    subir(nome);
    cacheAncestrais.set(nome, acc);
  }
  return cacheAncestrais.get(nome);
}

// Pais específicos (não amplos) compartilhados: tornam duas skills "parecidas".
export function paiEmComum(a, b) {
  const pa = new Set((porNome.get(a)?.pais || []).filter((p) => !porNome.get(p)?.amplo));
  return (porNome.get(b)?.pais || []).find((p) => pa.has(p) && !porNome.get(p)?.amplo) || null;
}

export const ehAmplo = (nome) => Boolean(porNome.get(nome)?.amplo);
