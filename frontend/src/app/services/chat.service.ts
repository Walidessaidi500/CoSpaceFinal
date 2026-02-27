import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/enviroments';

// ========================
// INTERFACES DEL SISTEMA DE CHAT
// ========================

/**
 * Representa los datos básicos de un usuario dentro del contexto del chat.
 */
export interface ChatUsuario {
    id_usuario: number;
    nombre_completo: string;
    foto_perfil: string | null;
}

/**
 * Representa un mensaje individual dentro de una conversación de chat.
 * La propiedad 'es_mio' indica si el mensaje fue enviado por el usuario actual.
 */
export interface ChatMensaje {
    id_mensaje: number;
    contenido: string;
    es_mio: boolean;
    emisor: {
        id_usuario: number;
        nombre_completo: string;
    };
    leido: boolean;
    created_at: string;
}

/**
 * Representa una conversación de chat con toda su información:
 * el otro participante, el último mensaje, el contador de no leídos y las fechas.
 */
export interface ChatConversacion {
    id_conv: number;
    otro_usuario: ChatUsuario;
    ultimo_mensaje: {
        contenido: string;
        created_at: string;
        es_mio: boolean;
    } | null;
    no_leidos: number;
    created_at: string;
    updated_at: string;
}

// ========================
// SERVICIO DE CHAT
// ========================

/**
 * Servicio de Chat (ChatService)
 *
 * Gestiona toda la funcionalidad del sistema de mensajería en tiempo real de CoSpace.
 * Utiliza polling (consultas periódicas al servidor) para simular la actualización
 * en tiempo real de conversaciones y mensajes.
 *
 * Estado reactivo:
 * - conversations$: lista de todas las conversaciones del usuario.
 * - messages$: mensajes de la conversación activa.
 * - isChatOpen$: estado de apertura/cierre del widget de chat.
 * - activeConversationId$: ID de la conversación actualmente seleccionada.
 * - unreadCount$: contador total de mensajes no leídos en todas las conversaciones.
 *
 * El polling se configura con intervalos diferentes:
 * - Conversaciones: cada 5 segundos.
 * - Mensajes de la conversación activa: cada 3 segundos.
 */
@Injectable({
    providedIn: 'root'
})
export class ChatService {

    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Subject para la lista de conversaciones del usuario
    private conversationsSubject = new BehaviorSubject<ChatConversacion[]>([]);
    conversations$ = this.conversationsSubject.asObservable();

    // Subject para controlar si el widget de chat está abierto o cerrado
    private isChatOpenSubject = new BehaviorSubject<boolean>(false);
    isChatOpen$ = this.isChatOpenSubject.asObservable();

    // Subject para el ID de la conversación actualmente seleccionada
    private activeConversationIdSubject = new BehaviorSubject<number | null>(null);
    activeConversationId$ = this.activeConversationIdSubject.asObservable();

    // Subject para los mensajes de la conversación activa
    private messagesSubject = new BehaviorSubject<ChatMensaje[]>([]);
    messages$ = this.messagesSubject.asObservable();

    // Subject para el contador total de mensajes no leídos
    private unreadCountSubject = new BehaviorSubject<number>(0);
    unreadCount$ = this.unreadCountSubject.asObservable();

    // Referencias a los intervalos de polling para poder detenerlos cuando sea necesario
    private pollingInterval: any = null;
    private messagePollingInterval: any = null;

    // ========================
    // GESTIÓN DE CONVERSACIONES
    // ========================

    /**
     * Carga todas las conversaciones del usuario autenticado desde la API.
     * Actualiza el Subject de conversaciones y recalcula el contador de no leídos.
     */
    loadConversations(): void {
        this.http.get<ChatConversacion[]>(`${this.apiUrl}/conversaciones`).pipe(
            catchError(err => {
                console.error('ChatService: Error al cargar conversaciones', err);
                return of([]);
            })
        ).subscribe(convs => {
            this.conversationsSubject.next(convs);
            this.updateUnreadFromConversations(convs);
        });
    }

    /**
     * Inicia el polling periódico de conversaciones (cada 5 segundos).
     * Carga las conversaciones inmediatamente y luego configura el intervalo.
     * Detiene cualquier polling anterior antes de iniciar uno nuevo para evitar duplicados.
     */
    startPolling(): void {
        this.stopPolling();
        this.loadConversations();
        this.pollingInterval = setInterval(() => {
            this.loadConversations();
        }, 5000);
    }

    /**
     * Detiene el polling periódico de conversaciones y de mensajes.
     * Limpia los intervalos de setInterval para evitar fugas de memoria.
     */
    stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.stopMessagePolling();
    }

    // ========================
    // CREAR / ENCONTRAR CONVERSACIÓN
    // ========================

    /**
     * Inicia o abre una conversación con otro usuario.
     * Si ya existe una conversación entre ambos, se abre la existente.
     * Si no existe, se crea una nueva. En ambos casos, se recarga la lista
     * de conversaciones, se establece como activa y se abre el widget de chat.
     *
     * @param idUsuarioDestino ID del usuario con el que se desea conversar.
     */
    startConversation(idUsuarioDestino: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/conversaciones`, {
            id_usuario_destino: idUsuarioDestino
        }).pipe(
            tap(res => {
                // Se recargan las conversaciones para incluir la nueva o actualizada
                this.loadConversations();
                // Se establece la conversación como activa y se abre el widget
                this.setActiveConversation(res.id_conv);
                this.openChat();
            })
        );
    }

    // ========================
    // GESTIÓN DE MENSAJES
    // ========================

    /**
     * Carga todos los mensajes de una conversación específica desde la API.
     * Al cargar los mensajes, el backend marca automáticamente como leídos
     * los mensajes del otro participante. También recarga las conversaciones
     * para actualizar el contador de no leídos.
     *
     * @param idConv ID de la conversación cuyos mensajes se quieren cargar.
     */
    loadMessages(idConv: number): void {
        this.http.get<ChatMensaje[]>(`${this.apiUrl}/conversaciones/${idConv}/mensajes`).pipe(
            catchError(err => {
                console.error('ChatService: Error al cargar mensajes', err);
                return of([]);
            })
        ).subscribe(msgs => {
            this.messagesSubject.next(msgs);
            // Se recargan las conversaciones para actualizar el contador de no leídos
            this.loadConversations();
        });
    }

    /**
     * Envía un nuevo mensaje dentro de una conversación existente.
     * Tras enviarlo, el mensaje se añade al array local de mensajes para
     * una actualización inmediata de la interfaz y se recargan las conversaciones.
     *
     * @param idConv ID de la conversación donde se envía el mensaje.
     * @param contenido Texto del mensaje a enviar.
     */
    sendMessage(idConv: number, contenido: string): Observable<ChatMensaje> {
        return this.http.post<ChatMensaje>(`${this.apiUrl}/conversaciones/${idConv}/mensajes`, {
            contenido
        }).pipe(
            tap(msg => {
                // Se añade el mensaje al array actual para actualización inmediata de la UI
                const current = this.messagesSubject.value;
                this.messagesSubject.next([...current, msg]);
                // Se recargan las conversaciones para actualizar el último mensaje mostrado
                this.loadConversations();
            })
        );
    }

    /**
     * Inicia el polling periódico de mensajes para la conversación activa (cada 3 segundos).
     * Carga los mensajes inmediatamente y luego configura el intervalo.
     *
     * @param idConv ID de la conversación cuyos mensajes se actualizan periódicamente.
     */
    startMessagePolling(idConv: number): void {
        this.stopMessagePolling();
        this.loadMessages(idConv);
        this.messagePollingInterval = setInterval(() => {
            this.loadMessages(idConv);
        }, 3000);
    }

    /**
     * Detiene el polling periódico de mensajes.
     * Se llama al salir de una conversación o al cerrar el widget de chat.
     */
    stopMessagePolling(): void {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
    }

    // ========================
    // CONTADOR DE MENSAJES NO LEÍDOS
    // ========================

    /**
     * Obtiene el total de mensajes no leídos directamente desde la API.
     */
    loadUnreadCount(): void {
        this.http.get<{ total: number }>(`${this.apiUrl}/conversaciones/no-leidos`).pipe(
            catchError(() => of({ total: 0 }))
        ).subscribe(res => {
            this.unreadCountSubject.next(res.total);
        });
    }

    /**
     * Recalcula el total de mensajes no leídos sumando los no leídos de cada conversación.
     * Se utiliza internamente cada vez que se actualizan las conversaciones.
     */
    private updateUnreadFromConversations(convs: ChatConversacion[]): void {
        const total = convs.reduce((sum, c) => sum + c.no_leidos, 0);
        this.unreadCountSubject.next(total);
    }

    // ========================
    // CONTROL DEL WIDGET DE CHAT
    // ========================

    /** Abre el widget de chat. */
    openChat(): void {
        this.isChatOpenSubject.next(true);
    }

    /** Cierra el widget de chat. */
    closeChat(): void {
        this.isChatOpenSubject.next(false);
    }

    /** Alterna el estado del widget de chat (abierto/cerrado). */
    toggleChat(): void {
        this.isChatOpenSubject.next(!this.isChatOpenSubject.value);
    }

    /**
     * Establece la conversación activa por su ID.
     * Si se pasa un ID válido, inicia el polling de mensajes para esa conversación.
     * Si se pasa null, detiene el polling y limpia los mensajes.
     *
     * @param idConv ID de la conversación a activar, o null para desactivar.
     */
    setActiveConversation(idConv: number | null): void {
        this.activeConversationIdSubject.next(idConv);
        if (idConv) {
            this.startMessagePolling(idConv);
        } else {
            this.stopMessagePolling();
            this.messagesSubject.next([]);
        }
    }

    /** Obtiene el ID de la conversación actualmente activa (valor sincrónico). */
    getActiveConversationId(): number | null {
        return this.activeConversationIdSubject.value;
    }

    /** Obtiene la lista actual de conversaciones (valor sincrónico). */
    getConversations(): ChatConversacion[] {
        return this.conversationsSubject.value;
    }

    /** Verifica si el usuario tiene alguna conversación. */
    hasConversations(): boolean {
        return this.conversationsSubject.value.length > 0;
    }
}
