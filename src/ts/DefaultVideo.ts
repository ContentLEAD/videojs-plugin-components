///<reference path='IVideo.ts'/>
///<reference path='IVideoSource.ts'/>
///<reference path='VideoSource.ts'/>
///<reference path='../definitions/JQuery.d.ts'/>
///<reference path='../definitions/VideoJS.d.ts'/>

module VjsPluginComponents {
    export class DefaultVideo implements IVideo {
        id: string;
        overlays: IOverlaySpecification[];
        aspectRatio: string;
        _player: _V_.IPlayer;
        _selectedSource: IVideoSource;
        _sources: IVideoSource[];
        _setSource: (src: string) => void;
        _sourcesByType: { [type: string]: IVideoSource[]; } = {};

        constructor(player, setSource: (src: string) => void ) {
            this._player = player;
            this._setSource = setSource;
            this.id = this._player.id();
            this.aspectRatio = "16:9";
        }

        getWithSrc(src: string): any {
            return jQuery.grep(this._player.options().sources,
                     (value) => {
                         return value.src == src
                     })[0];
        }

        getPlayingSource() {
            if (this._selectedSource === undefined) {
                this._selectedSource = new VideoSource(this.getWithSrc(this._player.currentSrc()));
            };

            return this._selectedSource;
        }

        setPlayingMatching(matchFunc: (sources: IVideoSource[]) => IVideoSource) {
            this.setPlayingSource(matchFunc(this.listSources()));
        }

        setPlayingSource(source: IVideoSource) {
            this._selectedSource = source;
            this._setSource(source.src);
        }

        listSourcesByType(type: string): VjsPluginComponents.IVideoSource[] {
            if (this._sourcesByType[type] === undefined) {
                var sources = jQuery.grep(this.listSources(),
                    (value) => {
                        return value.type == type
                    });

                this._sourcesByType[type] = sources;

                // Sort the array so it is in descending order
                this._sourcesByType[type].sort(function (a, b) {
                    return (parseFloat(b.resolution) - parseFloat(a.resolution));
                });
            };

            return this._sourcesByType[type];
        }

        listSources(): VjsPluginComponents.IVideoSource[]{
            if (typeof this._sources === "undefined") {
                this._sources = [];
                jQuery.each(this._player.options().sources, (i, source) => {
                    this._sources.push(new VideoSource(source));
                });
            }
            return this._sources;
        }
    }
}