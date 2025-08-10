export const projects = [
        {
            name: "chaiko (work in progress)",
            tools: "esp32, solidworks, react, nodejs",
            desc: "an esp32 powered automatic syrup dispenser, for making specialty drinks, that can be controlled wirelessly via a web UI",
            why: "I love making specialty drinks for my friends and family. As my home cafe continues to grow, I wanted a dedicated station for all of my drink mixing needs, as well as a convenient way to keep track of my ever-growing list of recipes for cocktails and lattes. Thus, the idea for Chaiko was born.",
            how: "Chaiko will feature a web UI built with React and NodeJS to create, manage, and send recipes. When a recipe is selected on the UI, the data for that recipe will be sent to an ESP32 via HTTP. The ESP32 would then read the data to determine how much of each syrup would be required, and drive the motors for the pumps associated with those syrups. The system will use peristaltic pumps with silicone tubing to ensure it remains food-safe while maintaining recipe accuracy",
        },
        {
            name: "melodie",
            tools: "raspberry pi, solidworks, python",
            desc: "a remote spotify controller that displays current playback info, featuring a customizable character that listens along with you",
            why: "I wanted a way to view and control my Spotify playback at a glance while studying without checking my phone/computer to avoid getting distracted. Thus I designed Melodie; a cute and functional tool that sits on my desk while I work. The display features a fully hand drawn customizable character that 'listens along' with the user while they work to keep them motivated through even the most gruelling study sessions.",
            how: "Melodie is powered by a Raspberry Pi running Python. The Python program fetches user's listening data from the Spotify API, then displays the current track and album on the screen using Pygame. Both the playback and the character's outfits are controlled via a miniature keyboard. In the future I'd like to add an RFID reader to the system that allows users to tap different NFC tags to play different albums, as well as adjusting the frame rate of the character's animation to match the BPM of the current song to give it a more immersive feel.",
        },
        {
            name: "uwfe aero package",
            tools: "solidworks, starccm+",
            desc: "design and manufacturing of UWFE's 2026 rear wing",
            why: "The University of Waterloo Formula Electric design team's aerodynamics subteam designs a new aero package every year. I'm working alongside my teammates to design a rear wing for the 2026 season, focusing on increasing downforce and improving mounting stability",
            how: "The wing is designed iteratively; a concept is modelled in SolidWorks, simulated in Star-CCM+, analyzed to understand which aspects performed well, and then the process is repeated. We ensured to account for how the wing would interact with other elements of the car, as well as ensuring that it is manufacturable. After the design phase, we manufacture the components out of carbon fibre, performing wet layups for the airfoils and resin infusions for the flat panels.",
        },
        {
            name: "apex motion servo depositor",
            tools: "plc",
            desc: "food-grade nozzles designed for cake decorating for use with cobot end of arm tooling",
            why: "Typical cream depositing solutions such as piston depositors and pressure tanks tend to damage delicate whipped products and lack accuracy and consistency. Thus, while working at Apex Motion Control, we designed a new solution: the Apex Motion Servo Depositor. The depositor uses a gear pump to move product from a hopper to the outlet, which allows products to maintain their texture, while maintaining consistent depositing accuracy.",
            how: "The system's gear pump is driven by an Allen Bradley motor, controlled by a Kinetix5100 servo drive and a Micro850 PLC. The PLC takes in a pneumatic input via a pressure switch which activates the motor, starting the pumping process. When the input is low, the pumping stops. The pneumatic input allows the system to integrate seamlessly with Apex's existing products, which use pneumatic signals to communicate with peripheral devices, complying with food safety standards. The system features two modes, depending on whether the deposit volumes need to be controlled by an external device, or if it will be used in isolation. The HMI allows for customization of deposit speed, volume, and timing, as well as user access levels for added security.",
        },
        {
            name: "apex motion tsi nozzles",
            tools: "solidworks",
            desc: "food-grade nozzles designed for cake decorating for use with cobot end of arm tooling",
            why: "While working at Apex Motion Control, I had the pleasure of working with our cake decorating systems, focusing on the top and side icing (TSI) of cakes of various shapes and sizes. Different cakes required different icing nozzles to ensure that the flow was consistent throughout, leaving the cakes with a smooth, even layer of buttercream throughout.",
            how: "Nozzle prototypes were modelled in SolidWorks, then 3D printed to test and validate designs. Successful designs were then remodelled and manufactured out of sheet metal, while maintaining as much of the original geometry as possible in order to ensure that the flow of the frosting, and by extension the cake decoration, did not differ from the prototype.",
        },
        {
            name: "apex motion camera calibration",
            tools: "python",
            desc: "ur script designed to calibrate robots used with conveyor systems equipped with cv",
            why: "Apex Motion Control's BakerBot Quad is a complex robotic cake decorating system that scans incoming pastries, then decorates them while tracking them along a conveyor. Due to the amount of different components on these systems that need to communicate with each other, there is a lot of time that is spent on calibration. The most notable of these calibration routines is that for converting the coordinates of a scanned pastry from camera coordinates to robot coordinates. This was historically done by physically measuring the offsets between these two components, then scanning and tracking test parts to validate these measurements, or adjust them as needed. This iterative process is extremely time-consuming, especially when there are several robots that need to be calibrated on a very long conveyor line. Thus, I designed a new calibration routine that only requires a part to be scanned once. The produced results are extremely accurate, with an accuracy of ± 2mm.",
            how: "A part is placed on the conveyor and scanned by a Gocator camera. The UR program fetches data from the camera via XML-RPC, and conveyor encoder data from the PLC via MODBUS. The operator stops the conveyor when the part is infront of the robot, and freedrives the robot to the centre of the part. The program combines the camera coordinates, the encoder distance, and the robot's tool coordinates together to produce the overall offset between the robot and the camera, which can then be applied to all future scanned parts.",
        }
    ];