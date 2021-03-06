///<reference path='../definitions/JQuery.d.ts'/>
///<reference path='../definitions/dustjs-linkedin.d.ts'/>
///<reference path='TimeBasedEventManager.ts'/>
///<reference path='PlayObserver.ts'/>
///<reference path='AddClassToElementAtTimes.ts'/>
///<reference path='IPeriod.ts'/>
///<reference path='IOverlay.ts'/>
///<reference path='ILayerRepository.ts'/>
///<reference path='IRenderEngine.ts'/>
///<reference path='IOverlaySpecification.ts'/>
///<reference path='IOverlayRepository.ts'/>
///<reference path='IPlayer.ts'/>
///<reference path='TriggerEventHooks.ts'/>

module VjsPluginComponents {
    export class OverlayRepository implements IOverlayRepository {
        _player: IPlayer;
        _layerRepository: ILayerRepository;
        _eventRepository: IObservableRepository;
        _baseRepository: IObservableRepository;

        constructor(baseRepository: IObservableRepository, player: IPlayer, layerRepository: ILayerRepository, timeBasedEventRepository: IObservableRepository) {
            this._eventRepository = timeBasedEventRepository;
            this._player = player;
            this._layerRepository = layerRepository;
            this._baseRepository = baseRepository;
        }

        createFromSpecification(overlaySpecification: IOverlaySpecification) {
            //Wish we were using callbacks here really.

            var layer = this._layerRepository.createFromSpecification(overlaySpecification);

            var overlay : IOverlay = {
                id: 0,
                name: overlaySpecification.name,
                layer: layer
            }

            var overlay = this.create(overlay);

            TriggerEventHooks(overlaySpecification.events, "onCreate", { player: this._player, overlay: overlay, overlays: this });

            var registerOverlayDisplayFunc = this.registerOverlayDisplay(overlay, overlaySpecification.events);

            //if (typeof this._player.duration() === "undefined") {
                for (var i = 0; i < overlaySpecification.displayTimes.length; i++) {
                    var displayTime = overlaySpecification.displayTimes[i];

                    this._player.one("durationset", registerOverlayDisplayFunc(displayTime));
                }
            //} else {
            //    for (var i = 0; i < overlaySpecification.displayTimes.length; i++) {
            //        var displayTime = overlaySpecification.displayTimes[i];
            //        registerOverlayDisplayFunc(displayTime)();
            //    }
            //}

            return overlay;
        }

        create(overlay: IOverlay) {
            return <IOverlay>this._baseRepository.create(overlay);
        }

        on(eventName: string, handler: (args) => void ) {
            this._baseRepository.on(eventName, handler);
        }

        trigger(eventName: string, args) {
            this._baseRepository.trigger(eventName, args);
        }

        toList() {
            return <IOverlay[]>this._baseRepository.toList();
        }

        getEntity(id: number) {
            return <IOverlay>this._baseRepository.getEntity(id);
        }

        getEntityByName(name: string) {
            return jQuery.grep(this.toList(), (overlay: IOverlay, i) => { return overlay.name === name })[0];
        }

        remove(id: number) {
            var entity = this.getEntity(id);

            this._layerRepository.remove(entity.layer.id);

            if (typeof (entity.event) !== "undefined") {
                this._eventRepository.remove(entity.event.id)
            }

            return this._baseRepository.remove(id);
        }

        update(Overlay: IOverlay) {
            return this._baseRepository.update(Overlay);
        }

        clear() {
            var items = this._baseRepository.toList()
            for (var i = 0; i < items.length; i++) {
                this.remove(items[i].id);
            }

            return true;
        }

        ///Curried
        private registerOverlayDisplay(overlay: IOverlay, events) {
            return (displayTime: { type: string; start: (videoEnd: number) => number; end: (videoEnd: number) => number; }) => {
                return () => {
                    var convertedDisplayTime = this.convertTimesToAbsolutes(displayTime);

                    overlay.event = <ITimeBasedEvent>this._eventRepository.create({
                        id: 0,
                        startEvent: {
                            time: convertedDisplayTime.start,
                            handler: () => {
                                TriggerEventHooks(events, "beforeShow", { player: this._player, overlay: overlay, overlays: this });
                                overlay.layer.container.addClass("vjsVisible");
                                TriggerEventHooks(events, "afterShow", { player: this._player, overlay: overlay, overlays: this });
                            }
                        },
                        endEvent: {
                            time: convertedDisplayTime.end,
                            handler: () => {
                                TriggerEventHooks(events, "beforeHide", { player: this._player, overlay: overlay, overlays: this });
                                overlay.layer.container.removeClass("vjsVisible");
                                TriggerEventHooks(events, "afterHide", { player: this._player, overlay: overlay, overlays: this });
                            }
                        }
                    });

                    this.update(overlay);
                }
            }
        }

        private convertTimesToAbsolutes(displayTime: { type: string; start: (videoEnd: number) => number; end: (videoEnd: number) => number; }) {
            var videoEnd = this._player.duration();
            var start: number = displayTime.start(videoEnd);
            var end: number = displayTime.end(videoEnd);

            return { type: displayTime.type, start: start, end: end };
        }
    }
}