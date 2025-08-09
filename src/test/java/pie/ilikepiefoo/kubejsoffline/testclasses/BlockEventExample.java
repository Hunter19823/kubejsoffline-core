package pie.ilikepiefoo.kubejsoffline.testclasses;

public interface BlockEventExample {
    EventExample<Break> BREAK = EventFactoryExample.createEvent(Break.class);

    EventExample<Place> PLACE = EventFactoryExample.createEvent(Place.class);


    public interface Break {
        void onBreak();
    }

    public interface Place {
        void onPlace();
    }


}
