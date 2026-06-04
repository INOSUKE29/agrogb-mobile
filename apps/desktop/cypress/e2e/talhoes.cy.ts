/// <reference types="cypress" />

describe('Nielsen Heuristics: Talhões Screen', () => {
  beforeEach(() => {
    // Acessa a página principal (assumindo que redireciona pro dashboard e aba talhões)
    // Opcionalmente, pode ser necessário realizar login programático via comandos customizados
    cy.visit('/');
    
    // Simula lentidão na rede para validar o Skeleton
    cy.intercept('GET', '**/rest/v1/talhoes*', (req) => {
      req.on('response', (res) => {
        res.setDelay(1000);
      });
    }).as('getTalhoes');
  });

  it('CT01 - Heurística #1: Deve exibir o Skeleton (Visibilidade de Status) durante o carregamento', () => {
    // Interceptamos a chamada para garantir que o loading apareça
    cy.visit('/talhoes'); // Assumindo rota direta
    
    // Verifica se a malha de Skeletons está renderizada na tabela
    cy.get('table').within(() => {
      cy.get('.animate-pulse').should('exist');
    });

    // Aguarda a rede resolver
    cy.wait('@getTalhoes');

    // Skeletons devem desaparecer
    cy.get('.animate-pulse').should('not.exist');
  });

  it('CT02 - Heurística #5 e #9: Deve interceptar exclusão com Modal de Prevenção de Erros', () => {
    cy.visit('/talhoes');
    cy.wait('@getTalhoes');

    // Clica no botão de excluir (lixeira) do primeiro talhão da lista
    // Nota: Requer que exista ao menos 1 talhão na base de dados de teste
    cy.get('button[title="Excluir"]').first().click();

    // Valida se o Modal foi aberto com as classes e textos corretos
    cy.contains('h3', 'Você tem certeza?').should('be.visible');
    cy.contains('A exclusão do talhão').should('be.visible');

    // Clica em Cancelar para abortar a exclusão acidental
    cy.contains('button', 'Cancelar').click();

    // Modal deve sumir
    cy.contains('h3', 'Você tem certeza?').should('not.exist');
  });
});
