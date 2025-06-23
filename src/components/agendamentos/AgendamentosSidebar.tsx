
import { Calendar, Clock, Plus, Settings, Users, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Visão Geral',
    icon: BarChart3,
    href: '/agendamentos',
  },
  {
    title: 'Calendário',
    icon: Calendar,
    href: '/agendamentos/calendario',
  },
  {
    title: 'Novo Agendamento',
    icon: Plus,
    href: '/agendamentos/novo',
  },
  {
    title: 'Horários Disponíveis',
    icon: Clock,
    href: '/agendamentos/horarios',
  },
  {
    title: 'Clientes',
    icon: Users,
    href: '/agendamentos/clientes',
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/agendamentos/configuracoes',
  },
];

export function AgendamentosSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Agendamentos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
