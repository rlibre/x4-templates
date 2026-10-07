import {
    Application,
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

class StatusBar extends HBox {
    declare refs: {
        clock: Label,
    };

    constructor() {
        super({});

        this.setContent([
            new Flex(),

            this.refs.clock = new Label({
                cls: "clock",
				icon: icons.clock
            }),
        ]);

        this.updateClock();

        this.setInterval("clock", 1000, () => {
            this.updateClock();
        });
    }

    private updateClock() {
		const now = new Date( );
        this.refs.clock.setText(
            formatIntlDate( now, "j d o H:I:S")
        );
    }
}


class MainView extends VBox {
    constructor() {
        super({
            cls: "app",
        });

        this.setContent([
            new AppHeader({
                icon: icons.app,
				title: "Basic application",
            }),

            new VBox({
                cls: "app-body",
                flex: true,
            }),

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