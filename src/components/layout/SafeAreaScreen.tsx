import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type SafeAreaScreenProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Reserva a barra de status no topo (padrão: true). */
  top?: boolean;
  /** Reserva a navigation bar inferior (padrão: true). */
  bottom?: boolean;
  /** Reserva os insets laterais (paisagem / telas curvas). */
  sides?: boolean;
  as?: 'div' | 'main' | 'section';
};

/**
 * Wrapper padrão de tela para o app nativo.
 * Aplica os insets de safe-area (--sai-*) de forma consistente em telas
 * que não usam PageHeader/AppHeader.
 */
const SafeAreaScreen = forwardRef<HTMLDivElement, SafeAreaScreenProps>(
  ({ top = true, bottom = true, sides = false, as = 'div', className, children, ...rest }, ref) => {
    const Tag = as as 'div';
    return (
      <Tag
        ref={ref}
        className={cn(
          top && 'pt-safe',
          bottom && 'pb-safe',
          sides && 'px-safe',
          className,
        )}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
SafeAreaScreen.displayName = 'SafeAreaScreen';

export default SafeAreaScreen;
