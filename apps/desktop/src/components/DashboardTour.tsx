import React, { useState, useEffect } from 'react';
import JoyridePkg, { STATUS } from 'react-joyride';

const Joyride = (JoyridePkg as any).default || (JoyridePkg as any).Joyride || JoyridePkg;

interface DashboardTourProps {
    role: 'AGRONOMO' | 'CLIENTE' | 'ADMIN' | null;
}

export default function DashboardTour({ role }: DashboardTourProps) {
    const [run, setRun] = useState(false);
    const [steps, setSteps] = useState<any[]>([]);

    useEffect(() => {
        if (!role) return;

        // Verifica se já fez o tour
        const tourKey = `agrogb_tour_${role.toLowerCase()}`;
        const hasSeenTour = localStorage.getItem(tourKey);

        // Dispara apenas se não tiver visto (ou se forçarmos o teste apagando o localstorage)
        if (!hasSeenTour) {
            if (role === 'AGRONOMO') {
                setSteps([
                    {
                        target: 'body',
                        content: 'Bem-vindo ao AgroGB V8! Vamos fazer um tour rápido pela sua nova estação de comando.',
                        placement: 'center',
                    },
                    {
                        target: '.tour-step-sidebar',
                        content: 'Aqui está a nova barra de navegação. Acesso rápido aos "Meus Clientes" para enviar convites pelo WhatsApp.',
                        placement: 'right',
                    },
                    {
                        target: '.tour-step-alertas',
                        content: 'Seu Radar de Produtores! Se um cliente reportar uma praga no app, ela acende em vermelho aqui para você intervir.',
                        placement: 'bottom',
                    },
                    {
                        target: '.tour-step-agenda',
                        content: 'Sua agenda sincronizada de visitas técnicas aos talhões.',
                        placement: 'left',
                    }
                ]);
            } else if (role === 'CLIENTE') {
                setSteps([
                    {
                        target: 'body',
                        content: 'Bem-vindo ao AgroGB Produtor! Seu novo painel de controle.',
                        placement: 'center',
                    },
                    {
                        target: '.tour-step-sidebar',
                        content: 'Seu menu principal. Caderno Agrícola, Financeiro e Estoque ficam aqui.',
                        placement: 'right',
                    }
                ]);
            }

            // Atraso de 1 segundo para garantir que a tela rendeu antes do tour tentar achar os seletores
            setTimeout(() => {
                setRun(true);
            }, 1000);
        }
    }, [role]);

    const handleJoyrideCallback = (data: any) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status) && role) {
            setRun(false);
            localStorage.setItem(`agrogb_tour_${role.toLowerCase()}`, 'true');
        }
    };

    if (!run || steps.length === 0) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            disableOverlayClose
            spotlightPadding={10}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#19B34A',
                    backgroundColor: '#1A1A1A',
                    textColor: '#fff',
                    arrowColor: '#1A1A1A',
                    overlayColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: 1000,
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#19B34A',
                    fontWeight: 'bold',
                    padding: '10px 16px',
                    borderRadius: '8px'
                },
                buttonBack: {
                    marginRight: 10,
                    color: '#888'
                },
                buttonSkip: {
                    color: '#666'
                }
            }}
            locale={{
                back: 'Anterior',
                close: 'Fechar',
                last: 'Finalizar',
                next: 'Próximo',
                skip: 'Pular'
            }}
        />
    );
}
