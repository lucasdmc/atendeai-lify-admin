Feature: RF02 - Agendamento com múltiplos calendários
  Como clínica com integração Google
  Quero mapear calendários por serviço e por profissional
  Para criar eventos no calendário correto

  Background:
    Given a clínica "Clinica X" com calendarsByService e calendarsByProfessional

  Scenario: Seleção de calendarId por serviço
    When o paciente seleciona o serviço "Ecocardiograma"
    Then o evento deve ser criado no calendário mapeado para o serviço

  Scenario: Seleção de calendarId por profissional
    Given o paciente escolhe a Dra. Ana
    When o agendamento é confirmado
    Then o evento deve ser criado no calendário mapeado para a Dra. Ana

