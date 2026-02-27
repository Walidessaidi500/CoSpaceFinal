import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    ChangeDetectorRef,
    inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService, ChatConversacion, ChatMensaje } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

/**
 * Componente Widget de Chat
 *
 * Este componente implementa un widget flotante de chat en la esquina inferior derecha
 * de la pantalla. Permite a los usuarios autenticados ver sus conversaciones,
 * enviar y recibir mensajes en tiempo real mediante polling.
 *
 * El widget tiene dos vistas:
 * 1. Lista de conversaciones: muestra todas las conversaciones con el último mensaje y no leídos.
 * 2. Vista de mensajes: muestra el hilo de mensajes de la conversación seleccionada.
 *
 * Se suscribe a múltiples observables del ChatService para mantener la UI sincronizada.
 * Implementa auto-scroll al fondo cuando llegan nuevos mensajes.
 */
@Component({
    selector: 'app-chat-widget',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './chat-widget.component.html',
    styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {

    private chatService = inject(ChatService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    // Referencia al contenedor de mensajes para controlar el scroll automático
    @ViewChild('messagesContainer') messagesContainer!: ElementRef;

    // Estado de la interfaz del widget
    isChatOpen: boolean = false;
    conversations: ChatConversacion[] = [];
    activeConversationId: number | null = null;
    messages: ChatMensaje[] = [];
    unreadCount: number = 0;
    messageText: string = '';
    isAuthenticated: boolean = false;

    // Información de la conversación activa para mostrar en la cabecera del chat
    activeConvInfo: ChatConversacion | null = null;

    // Array de suscripciones para limpiar al destruir el componente
    private subs: Subscription[] = [];
    // Flag para controlar cuándo se debe hacer auto-scroll al fondo
    private shouldScrollToBottom = false;
    // Contador de mensajes para detectar nuevos mensajes
    private lastMessageCount = 0;

    /**
     * Inicializa el widget de chat.
     * Verifica la autenticación del usuario y, si está autenticado,
     * inicia el polling de conversaciones y se suscribe a todos los observables del ChatService.
     */
    ngOnInit(): void {
        const user = this.authService.getUser();
        this.isAuthenticated = !!user;

        if (!this.isAuthenticated) return;

        // Se inicia el polling para actualizar conversaciones periódicamente
        this.chatService.startPolling();

        // Suscripción al estado de apertura/cierre del widget
        this.subs.push(
            this.chatService.isChatOpen$.subscribe(isOpen => {
                this.isChatOpen = isOpen;
                if (isOpen) {
                    this.shouldScrollToBottom = true;
                }
                this.cdr.detectChanges();
            })
        );

        // Suscripción a la lista de conversaciones
        this.subs.push(
            this.chatService.conversations$.subscribe(convs => {
                this.conversations = convs;
                // Se actualiza la información de la conversación activa si existe
                if (this.activeConversationId) {
                    this.activeConvInfo = convs.find(c => c.id_conv === this.activeConversationId) || null;
                }
                this.cdr.detectChanges();
            })
        );

        // Suscripción al cambio de conversación activa
        this.subs.push(
            this.chatService.activeConversationId$.subscribe(id => {
                this.activeConversationId = id;
                if (id) {
                    this.activeConvInfo = this.conversations.find(c => c.id_conv === id) || null;
                } else {
                    this.activeConvInfo = null;
                }
                this.shouldScrollToBottom = true;
                this.cdr.detectChanges();
            })
        );

        // Suscripción a los mensajes de la conversación activa
        this.subs.push(
            this.chatService.messages$.subscribe(msgs => {
                // Se detectan nuevos mensajes comparando con el contador anterior
                if (msgs.length > this.lastMessageCount) {
                    this.shouldScrollToBottom = true;
                }
                this.lastMessageCount = msgs.length;

                // Solo actualizamos los mensajes si ha cambiado la longitud (nuevo mensaje)
                // O si estamos cargándolos por primera vez. Esto evita el parpadeo del polling.
                if (this.messages.length !== msgs.length) {
                    this.messages = msgs;
                    this.cdr.detectChanges();
                }
            })
        );

        // Suscripción al contador de mensajes no leídos
        this.subs.push(
            this.chatService.unreadCount$.subscribe(count => {
                this.unreadCount = count;
                this.cdr.detectChanges();
            })
        );
    }

    /**
     * Se ejecuta después de cada comprobación de la vista.
     * Si hay nuevos mensajes, hace scroll automático al fondo del contenedor.
     */
    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    /**
     * Limpieza al destruir el componente.
     * Detiene el polling y desuscribe todas las suscripciones para evitar fugas de memoria.
     */
    ngOnDestroy(): void {
        this.chatService.stopPolling();
        this.subs.forEach(s => s.unsubscribe());
    }

    // ========================
    // ACCIONES DE LA INTERFAZ
    // ========================

    /** Alterna la visibilidad del widget de chat. */
    toggleChat(): void {
        this.chatService.toggleChat();
    }

    /** Abre una conversación específica y activa su polling de mensajes. */
    openConversation(conv: ChatConversacion): void {
        this.chatService.setActiveConversation(conv.id_conv);
        this.shouldScrollToBottom = true;
    }

    /** Vuelve a la lista de conversaciones desactivando la conversación activa. */
    goBackToList(): void {
        this.chatService.setActiveConversation(null);
    }

    /**
     * Envía un nuevo mensaje en la conversación activa.
     * Si el envío falla, restaura el texto del mensaje para que el usuario pueda reintentar.
     */
    sendMessage(): void {
        if (!this.messageText.trim() || !this.activeConversationId) return;

        const texto = this.messageText.trim();
        this.messageText = '';

        this.chatService.sendMessage(this.activeConversationId, texto).subscribe({
            next: () => {
                this.shouldScrollToBottom = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error enviando mensaje:', err);
                // Se restaura el texto si el envío falla para que el usuario pueda reintentar
                this.messageText = texto;
                this.cdr.detectChanges();
            }
        });
    }

    // ========================
    // UTILIDADES DE FORMATO
    // ========================

    /** Obtiene la inicial del nombre para mostrar como avatar por defecto. */
    getInitial(name: string): string {
        return name ? name.charAt(0).toUpperCase() : '?';
    }

    /**
     * Formatea una fecha en formato relativo legible (ej: 'Ahora', '5 min', '2h', '3d').
     * Para fechas de más de 7 días, muestra el formato 'dd mes'.
     */
    formatTime(dateStr: string): string {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }

    /** Formatea la hora de un mensaje en formato HH:MM. */
    formatMessageTime(dateStr: string): string {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    // ========================
    // SCROLL AUTOMÁTICO
    // ========================

    /**
     * Desplaza el contenedor de mensajes hasta el fondo para mostrar los mensajes más recientes.
     * Se silencian errores en caso de que el elemento aún no exista en el DOM.
     */
    private scrollToBottom(): void {
        try {
            if (this.messagesContainer) {
                const el = this.messagesContainer.nativeElement;
                el.scrollTop = el.scrollHeight;
            }
        } catch (err) {
            // Se silencia el error si el contenedor aún no existe en el DOM
        }
    }
}
