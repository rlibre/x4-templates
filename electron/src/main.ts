import {
    Application,
    Button,
    Component,
    ComponentProps,
    Flex,
    formatIntlDate,
    HBox,
    Icon,
    Label,
    VBox,
} from "x4js";

import icons from "./icons";
import "./main.scss";

interface AppHeaderProps extends ComponentProps {
    icon: string;
    title: string;
}

class AppHeader extends HBox<AppHeaderProps> {
    constructor(props: AppHeaderProps) {
        super(props);

        this.setContent([
            new Icon({
                cls: "icon",
                iconId: props.icon,
            }),

            new Label({
                cls: "title",
                text: props.title,
            }),
        ]);
    }
}

/**
 * Shows a text file chosen with the file dialog of the system.
 */

class FileView extends VBox {
    declare refs: {
        path: Label,
        text: Component,
    };

    constructor() {
        super({
            flex: true,
        });

        this.setContent([
            new HBox({
                cls: "toolbar",
                content: [
                    new Button({
                        label: "Open a text file...",
                        click: () => this.openFile(),
                    }),

                    this.refs.path = new Label({
                        cls: "path",
                        text: "",
                    }),
                ],
            }),

            this.refs.text = new Component({
                tag: "pre",
                cls: "text",
                flex: true,
            }),
        ]);
    }

    private async openFile() {
        const file = await window.host.openTextFile();
        if (!file)
            return;

        this.refs.path.setText(file.path);
        this.refs.text.setContent(file.text);
    }
}

class StatusBar extends HBox {
    declare refs: {
        host: Label,
        clock: Label,
    };

    constructor() {
        super({});

        this.setContent([
            this.refs.host = new Label({
                cls: "host",
                text: "",
            }),

            new Flex(),

            this.refs.clock = new Label({
                cls: "clock",
                icon: icons.clock,
            }),
        ]);

        this.updateHost();
        this.updateClock();

        this.setInterval("clock", 1000, () => {
            this.updateClock();
        });
    }

    private async updateHost() {
        const info = await window.host.getInfo();
        this.refs.host.setText(
            `${info.name} ${info.version} - ${info.runtime} - ${info.platform}`
        );
    }

    private updateClock() {
        const now = new Date();
        this.refs.clock.setText(
            formatIntlDate(now, "j d o H:I:S")
        );
    }
}


class MainView extends VBox {
    constructor() {
        super({});

        this.setContent([
            new AppHeader({
                icon: icons.app,
                title: "Desktop application",
            }),

            new FileView(),

            new StatusBar(),
        ]);
    }
}


class App extends Application {
    constructor() {
        super({});

        this.setMainView(
            new MainView(),
        );
    }
}


new App();
