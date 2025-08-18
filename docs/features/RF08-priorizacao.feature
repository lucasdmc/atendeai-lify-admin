Feature: RF08 - Priorização de Agendamentos
  Como clínica
  Quero priorizar tipos de atendimentos (urgência > retorno > exame)
  Para otimizar a alocação de horários

  Background:
    Given a clínica "Clinica X" com priorização ["urgencia", "retorno", "exame"]

  Scenario: Ordenação de serviços respeita a priorização
    When o paciente pergunta por horários disponíveis
    Then a lista de serviços deve exibir itens em ordem de prioridade

  Scenario: Realocar paciente com notificação
    Given não há slot para urgência no período solicitado
    When o paciente confirma interesse em ser realocado
    Then o sistema deve realocar para o próximo horário e notificar o paciente

