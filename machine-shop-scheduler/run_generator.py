import json
import os
import sys

sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        "src"
    )
)

from src.data_generator.config import SEED
from src.data_generator.generator import generate_baseline_dataset
from src.data_generator.validators import run_all_validations


def main():
    os.makedirs(
        "data/generated",
        exist_ok=True
    )

    print(
        f"Generating dataset with seed {SEED}..."
    )

    dataset = generate_baseline_dataset()

    print(
        "Running structural and realism validations..."
    )

    try:
        validated_dataset = run_all_validations(
            dataset,
            schema_path="data/generated/schema.json"
        )

        print("Validation PASSED!")

    except Exception as e:
        print(
            f"Validation FAILED: {e}"
        )

        sys.exit(1)

    output_path = (
        "data/generated/baseline.json"
    )

    with open(
        output_path,
        "w"
    ) as f:
        json.dump(
            validated_dataset,
            f,
            indent=2
        )

    print(
        "Validated baseline dataset successfully "
        f"saved to {output_path}"
    )


if __name__ == "__main__":
    main()